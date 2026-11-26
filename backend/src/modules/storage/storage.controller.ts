import { Controller, Get, Param, Res, NotFoundException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Storage & 3D Vault')
@Controller('api/v1/storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private storageService: StorageService) {}

  @Get('models/:filename')
  @ApiOperation({ summary: 'Stream custom 3D model (.glb) directly from hosting server' })
  @ApiResponse({ status: 200, description: 'GLB 3D binary stream' })
  @ApiResponse({ status: 404, description: 'Model file not found' })
  getModel(@Param('filename') filename: string, @Res() res: Response) {
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.storageService.getModelsDir(), safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`3D model file ${safeFilename} was not found on the hosting server.`);
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'model/gltf-binary',
      'Content-Length': stat.size,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  }

  @Get('thumbnails/:filename')
  @ApiOperation({ summary: 'Stream preview thumbnail (.webp) from hosting server' })
  @ApiResponse({ status: 200, description: 'WebP image stream' })
  getThumbnail(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.storageService.getThumbnailsDir(), safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Thumbnail ${safeFilename} was not found.`);
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'image/webp',
      'Content-Length': stat.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  }
}
