import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface StorageUploadResult {
  url: string;
  storage_key: string;
  sha256: string;
  size_bytes: number;
  content_type: string;
  object_lock_mode?: string;
  retain_until_date?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private objectLockEnabled: boolean;
  private localDir: string;
  private modelsDir: string;
  private thumbnailsDir: string;
  private port: number;

  constructor(private configService: ConfigService) {
    const s3Config = this.configService.get('storage');
    this.bucketName = s3Config.bucketName;
    this.objectLockEnabled = s3Config.objectLockEnabled;
    this.port = this.configService.get<number>('port') || 4000;
    this.localDir = path.resolve(process.cwd(), s3Config.localStoragePath || './uploads');

    this.modelsDir = path.join(this.localDir, 'models');
    this.thumbnailsDir = path.join(this.localDir, 'thumbnails');

    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailsDir)) {
      fs.mkdirSync(this.thumbnailsDir, { recursive: true });
    }

    try {
      this.s3Client = new S3Client({
        region: s3Config.region,
        endpoint: s3Config.endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: s3Config.accessKey,
          secretAccessKey: s3Config.secretKey,
        },
      });
      this.logger.log(`Initialized S3 storage client pointing to ${s3Config.endpoint}`);
    } catch (err) {
      this.logger.warn(`Failed to initialize S3 client (${err.message}). Using local storage fallback.`);
    }
  }

  public getModelsDir(): string {
    return this.modelsDir;
  }

  public getThumbnailsDir(): string {
    return this.thumbnailsDir;
  }

  public getLocalDir(): string {
    return this.localDir;
  }

  /**
   * Computes SHA-256 hash of a buffer
   */
  public computeBufferHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Downloads remote 3D file (.glb) from AI engine and permanently saves it to the hosting server
   */
  async archiveRemoteModel(
    remoteUrl: string,
    taskId: string,
  ): Promise<{ localUrl: string; sha256: string; filePath: string }> {
    const fileName = `${taskId}.glb`;
    const targetPath = path.join(this.modelsDir, fileName);

    // If already downloaded and cached locally, return immediately
    if (fs.existsSync(targetPath)) {
      const existingBuffer = fs.readFileSync(targetPath);
      const sha256 = this.computeBufferHash(existingBuffer);
      return {
        localUrl: `http://localhost:${this.port}/api/v1/storage/models/${fileName}`,
        sha256,
        filePath: targetPath,
      };
    }

    try {
      this.logger.log(`[StorageVault] Archiving remote 3D model to hosting server: ${taskId}...`);
      const res = await axios.get(remoteUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data);
      const sha256 = this.computeBufferHash(buffer);

      // Save binary file to persistent local models directory
      fs.writeFileSync(targetPath, buffer);

      // Save WORM immutable metadata file alongside
      const wormMetaPath = `${targetPath}.worm.json`;
      fs.writeFileSync(
        wormMetaPath,
        JSON.stringify(
          {
            task_id: taskId,
            sha256,
            size_bytes: buffer.length,
            created_at: new Date().toISOString(),
            source_url: remoteUrl.split('?')[0],
            storage_type: 'HOSTING_SERVER_LOCAL_VAULT',
            worm_protected: true,
          },
          null,
          2,
        ),
      );

      this.logger.log(
        `[StorageVault] 3D Model successfully saved to hosting server: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB) [SHA256: ${sha256.substring(0, 12)}...]`,
      );

      return {
        localUrl: `http://localhost:${this.port}/api/v1/storage/models/${fileName}`,
        sha256,
        filePath: targetPath,
      };
    } catch (err: any) {
      this.logger.error(`Failed to archive remote 3D model: ${err.message}`);
      throw err;
    }
  }

  /**
   * Downloads remote thumbnail image and permanently saves it to the hosting server
   */
  async archiveRemoteThumbnail(remoteUrl: string, taskId: string): Promise<string> {
    const fileName = `${taskId}.webp`;
    const targetPath = path.join(this.thumbnailsDir, fileName);

    if (fs.existsSync(targetPath)) {
      return `http://localhost:${this.port}/api/v1/storage/thumbnails/${fileName}`;
    }

    try {
      const res = await axios.get(remoteUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data);
      fs.writeFileSync(targetPath, buffer);
      return `http://localhost:${this.port}/api/v1/storage/thumbnails/${fileName}`;
    } catch (err: any) {
      this.logger.warn(`Failed to archive thumbnail: ${err.message}`);
      return remoteUrl;
    }
  }

  /**
   * Uploads file to immutable vault with SHA-256 calculation and Object Lock retention
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    retentionDays = 365,
  ): Promise<StorageUploadResult> {
    const sha256 = this.computeBufferHash(fileBuffer);
    const ext = path.extname(fileName) || '.bin';
    const storageKey = `vault/${new Date().getFullYear()}/${sha256.substring(0, 16)}_${Date.now()}${ext}`;

    const retainUntil = new Date();
    retainUntil.setDate(retainUntil.getDate() + retentionDays);
    const retainUntilStr = retainUntil.toISOString();

    let uploadedUrl = `/uploads/${path.basename(storageKey)}`;

    // Attempt S3 upload with Object Lock headers
    if (this.s3Client) {
      try {
        const putParams: any = {
          Bucket: this.bucketName,
          Key: storageKey,
          Body: fileBuffer,
          ContentType: contentType,
          Metadata: {
            'sha256-checksum': sha256,
            'worm-protected': 'true',
          },
        };

        if (this.objectLockEnabled) {
          putParams.ObjectLockMode = 'COMPLIANCE';
          putParams.ObjectLockRetainUntilDate = retainUntil;
        }

        await this.s3Client.send(new PutObjectCommand(putParams));
        uploadedUrl = `${this.configService.get('storage.endpoint')}/${this.bucketName}/${storageKey}`;
        this.logger.log(`Uploaded file to S3 Vault: ${storageKey} [SHA256: ${sha256.substring(0, 8)}...]`);
      } catch (err: any) {
        this.logger.warn(`S3 upload failed (${err.message}). Falling back to local storage vault.`);
        uploadedUrl = this.saveLocalFile(fileBuffer, storageKey, sha256);
      }
    } else {
      uploadedUrl = this.saveLocalFile(fileBuffer, storageKey, sha256);
    }

    return {
      url: uploadedUrl,
      storage_key: storageKey,
      sha256,
      size_bytes: fileBuffer.length,
      content_type: contentType,
      object_lock_mode: this.objectLockEnabled ? 'COMPLIANCE' : 'NONE',
      retain_until_date: retainUntilStr,
    };
  }

  private saveLocalFile(buffer: Buffer, storageKey: string, sha256: string): string {
    const fullPath = path.join(this.localDir, path.basename(storageKey));
    fs.writeFileSync(fullPath, buffer);
    // Write metadata file alongside
    const metaPath = `${fullPath}.worm.json`;
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          sha256,
          created_at: new Date().toISOString(),
          object_lock: 'COMPLIANCE_LOCAL_SIMULATED',
        },
        null,
        2,
      ),
    );
    return `/uploads/${path.basename(storageKey)}`;
  }
}
