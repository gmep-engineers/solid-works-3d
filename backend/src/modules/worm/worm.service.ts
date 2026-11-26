import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as crypto from 'crypto';

export type WormEventType =
  | 'USER_INPUT_UPLOADED'
  | 'TRIPO3D_MODEL_GENERATED'
  | 'CUSTOMIZATION_SUBMITTED'
  | 'PAYMENT_AUTHORIZED_AND_CAPTURED'
  | 'JOB_DISPATCHED_TO_SUPPLIER'
  | 'BIDDING_OPENED'
  | 'SUPPLIER_BID_SUBMITTED'
  | 'BID_AWARDED_TO_SUPPLIER'
  | 'SUPPLIER_JOB_ACCEPTED'
  | 'SUPPLIER_JOB_DECLINED'
  | 'SUPPLIER_MODEL_UPLOADED'
  | 'CUSTOMER_APPROVAL_RECORDED'
  | 'PRODUCTION_STAGE_UPDATED'
  | 'SUPPLIER_DISPATCHED_TO_US_HUB'
  | 'US_HUB_INBOUND_RECEIVED'
  | 'US_HUB_DISPATCHED_TO_CLIENT'
  | 'SHIPMENT_DISPATCHED'
  | 'DELIVERY_CONFIRMED'
  | 'MANUFACTURER_REGISTERED'
  | 'MANUFACTURER_UPDATED'
  | 'MANUFACTURER_STATUS_UPDATED'
  | 'MANUFACTURER_DEVICE_TOKEN_ROTATED'
  | 'VENDOR_REGISTERED'
  | 'VENDOR_UPDATED'
  | 'VENDOR_STATUS_UPDATED'
  | 'VENDOR_DEVICE_TOKEN_ROTATED'
  | 'TRIPO_API_KEY_UPDATED'
  | 'WALLET_TOPUP'
  | 'USER_CREDENTIALS_UPDATED'
  | 'ADMIN_USER_UPDATED'
  | 'ADMIN_WALLET_ADJUSTMENT'
  | 'ADMIN_PASSWORD_RESET'
  | 'ADMIN_OVERRIDE_LOGGED';

export interface WormEventRecord {
  event_id: string;
  sequence_num: number;
  timestamp_utc: string | Date;
  actor_role: string;
  actor_id: string;
  order_id?: string;
  event_type: WormEventType;
  payload_json: Record<string, any>;
  artifact_sha256?: string;
  previous_event_hash: string;
  event_hash: string;
}

export interface VerificationResult {
  order_id: string;
  is_valid: boolean;
  total_events: number;
  genesis_hash: string;
  latest_hash: string;
  verified_at: string;
  events_chain: Array<{
    sequence_num: number;
    event_type: WormEventType;
    actor_role: string;
    timestamp_utc: string | Date;
    artifact_sha256?: string;
    computed_hash: string;
    stored_hash: string;
    matches: boolean;
    previous_hash: string;
  }>;
  tamper_detected: boolean;
  tamper_details?: string;
  certificate_fingerprint: string;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

@Injectable()
export class WormService {
  private readonly logger = new Logger(WormService.name);

  constructor(private db: DatabaseService) {}

  /**
   * Computes SHA-256 hash of a string, buffer, or canonical JSON object
   */
  public computeHash(data: string | Buffer | Record<string, any>): string {
    if (typeof data === 'object' && !Buffer.isBuffer(data)) {
      // Deterministic JSON stringification to prevent property order discrepancies
      const canonicalString = this.canonicalizeJson(data);
      return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
    }
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Sort keys alphabetically for canonical JSON representation
   */
  private canonicalizeJson(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map((item) => this.canonicalizeJson(item)).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map(
      (key) => `${JSON.stringify(key)}:${this.canonicalizeJson(obj[key])}`,
    );
    return '{' + parts.join(',') + '}';
  }

  /**
   * Calculates the cryptographically chained event hash
   */
  public computeEventHash(params: {
    previous_event_hash: string;
    sequence_num: number;
    timestamp_utc: string;
    actor_role: string;
    actor_id: string;
    order_id?: string;
    event_type: WormEventType;
    artifact_sha256?: string;
    payload_json: Record<string, any>;
  }): string {
    const rawString = [
      params.previous_event_hash || GENESIS_HASH,
      params.sequence_num.toString(),
      params.timestamp_utc,
      params.actor_role,
      params.actor_id || '',
      params.order_id || '',
      params.event_type,
      params.artifact_sha256 || '',
      this.canonicalizeJson(params.payload_json || {}),
    ].join('||');

    return crypto.createHash('sha256').update(rawString, 'utf8').digest('hex');
  }

  /**
   * Records a WORM audit event into the append-only ledger
   */
  async recordEvent(params: {
    actor_role: 'CUSTOMER' | 'ADMIN' | 'SUPPLIER' | 'SYSTEM';
    actor_id?: string;
    order_id?: string;
    event_type: WormEventType;
    payload_json: Record<string, any>;
    artifact_sha256?: string;
  }): Promise<WormEventRecord> {
    const timestampUtc = new Date().toISOString();

    let previousHash = GENESIS_HASH;
    let nextSeqNum = 1;

    // Get previous event to link the hash chain
    if (this.db.isPostgresConnected) {
      const lastEventRes = await this.db.query(
        'SELECT sequence_num, event_hash FROM worm_audit_events ORDER BY sequence_num DESC LIMIT 1',
      );
      if (lastEventRes.rows.length > 0) {
        previousHash = lastEventRes.rows[0].event_hash;
        nextSeqNum = Number(lastEventRes.rows[0].sequence_num) + 1;
      }
    } else {
      const memoryEvents = this.db.getMemoryStore().worm_audit_events;
      if (memoryEvents.length > 0) {
        const last = memoryEvents[memoryEvents.length - 1];
        previousHash = last.event_hash;
        nextSeqNum = last.sequence_num + 1;
      }
    }

    const eventHash = this.computeEventHash({
      previous_event_hash: previousHash,
      sequence_num: nextSeqNum,
      timestamp_utc: timestampUtc,
      actor_role: params.actor_role,
      actor_id: params.actor_id || 'SYSTEM',
      order_id: params.order_id,
      event_type: params.event_type,
      artifact_sha256: params.artifact_sha256,
      payload_json: params.payload_json,
    });

    const eventRecord: WormEventRecord = {
      event_id: crypto.randomUUID(),
      sequence_num: nextSeqNum,
      timestamp_utc: timestampUtc,
      actor_role: params.actor_role,
      actor_id: params.actor_id || 'SYSTEM',
      order_id: params.order_id,
      event_type: params.event_type,
      payload_json: params.payload_json,
      artifact_sha256: params.artifact_sha256,
      previous_event_hash: previousHash,
      event_hash: eventHash,
    };

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `INSERT INTO worm_audit_events (
          event_id, sequence_num, timestamp_utc, actor_role, actor_id, 
          order_id, event_type, payload_json, artifact_sha256, 
          previous_event_hash, event_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          eventRecord.event_id,
          eventRecord.sequence_num,
          eventRecord.timestamp_utc,
          eventRecord.actor_role,
          eventRecord.actor_id,
          eventRecord.order_id,
          eventRecord.event_type,
          JSON.stringify(eventRecord.payload_json),
          eventRecord.artifact_sha256,
          eventRecord.previous_event_hash,
          eventRecord.event_hash,
        ],
      );
    } else {
      this.db.getMemoryStore().worm_audit_events.push(eventRecord);
    }

    this.logger.log(
      `[WORM_AUDIT] Seq #${eventRecord.sequence_num} [${eventRecord.event_type}] for Order [${eventRecord.order_id || 'GLOBAL'}] recorded. Hash: ${eventHash.substring(0, 12)}...`,
    );

    return eventRecord;
  }

  /**
   * Recomputes and verifies the complete cryptographic hash chain for an order
   */
  async verifyOrderChain(orderId: string): Promise<VerificationResult> {
    let events: WormEventRecord[] = [];

    if (this.db.isPostgresConnected) {
      const res = await this.db.query(
        'SELECT * FROM worm_audit_events WHERE order_id = $1 ORDER BY sequence_num ASC',
        [orderId],
      );
      events = res.rows;
    } else {
      events = this.db.getMemoryStore().worm_audit_events.filter((e) => e.order_id === orderId);
    }

    const chainDetails: VerificationResult['events_chain'] = [];
    let isOverallValid = true;
    let tamperDetails: string | undefined = undefined;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const isoTimestamp = new Date(ev.timestamp_utc).toISOString();

      const computedHash = this.computeEventHash({
        previous_event_hash: ev.previous_event_hash,
        sequence_num: Number(ev.sequence_num),
        timestamp_utc: isoTimestamp,
        actor_role: ev.actor_role,
        actor_id: ev.actor_id,
        order_id: ev.order_id,
        event_type: ev.event_type,
        artifact_sha256: ev.artifact_sha256,
        payload_json: typeof ev.payload_json === 'string' ? JSON.parse(ev.payload_json) : ev.payload_json,
      });

      const matches = computedHash === ev.event_hash;
      if (!matches) {
        isOverallValid = false;
        tamperDetails = `Hash mismatch detected at sequence #${ev.sequence_num} [${ev.event_type}]. Expected ${computedHash}, Stored: ${ev.event_hash}`;
      }

      chainDetails.push({
        sequence_num: Number(ev.sequence_num),
        event_type: ev.event_type,
        actor_role: ev.actor_role,
        timestamp_utc: ev.timestamp_utc,
        artifact_sha256: ev.artifact_sha256,
        computed_hash: computedHash,
        stored_hash: ev.event_hash,
        matches,
        previous_hash: ev.previous_event_hash,
      });
    }

    const latestHash = events.length > 0 ? events[events.length - 1].event_hash : GENESIS_HASH;
    const genesisHash = events.length > 0 ? events[0].previous_event_hash : GENESIS_HASH;

    // Generate cryptographic certificate fingerprint
    const certFingerprint = crypto
      .createHash('sha256')
      .update(`${orderId}:${latestHash}:${new Date().toISOString()}`)
      .digest('hex');

    return {
      order_id: orderId,
      is_valid: isOverallValid,
      total_events: events.length,
      genesis_hash: genesisHash,
      latest_hash: latestHash,
      verified_at: new Date().toISOString(),
      events_chain: chainDetails,
      tamper_detected: !isOverallValid,
      tamper_details: tamperDetails,
      certificate_fingerprint: certFingerprint,
    };
  }

  /**
   * Get all WORM events for admin explorer
   */
  async getEvents(limit = 100, offset = 0, orderId?: string): Promise<{ events: WormEventRecord[]; total: number }> {
    if (this.db.isPostgresConnected) {
      const whereClause = orderId ? 'WHERE order_id = $3' : '';
      const params = orderId ? [limit, offset, orderId] : [limit, offset];
      const countRes = await this.db.query(
        `SELECT COUNT(*) FROM worm_audit_events ${whereClause}`,
        orderId ? [orderId] : [],
      );
      const res = await this.db.query(
        `SELECT * FROM worm_audit_events ${whereClause} ORDER BY sequence_num DESC LIMIT $1 OFFSET $2`,
        params,
      );
      return {
        events: res.rows,
        total: parseInt(countRes.rows[0].count, 10),
      };
    } else {
      let filtered = this.db.getMemoryStore().worm_audit_events;
      if (orderId) {
        filtered = filtered.filter((e) => e.order_id === orderId);
      }
      const sorted = [...filtered].reverse();
      return {
        events: sorted.slice(offset, offset + limit),
        total: filtered.length,
      };
    }
  }
}
