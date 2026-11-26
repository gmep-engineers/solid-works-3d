import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`,
  );
  return '{' + parts.join(',') + '}';
}

function computeEventHash(params: {
  previous_event_hash: string;
  sequence_num: number;
  timestamp_utc: string;
  actor_role: string;
  actor_id: string;
  order_id?: string;
  event_type: string;
  artifact_sha256?: string;
  payload_json: Record<string, any>;
}): string {
  const rawString = [
    params.previous_event_hash || '0000000000000000000000000000000000000000000000000000000000000000',
    params.sequence_num.toString(),
    params.timestamp_utc,
    params.actor_role,
    params.actor_id || '',
    params.order_id || '',
    params.event_type,
    params.artifact_sha256 || '',
    canonicalizeJson(params.payload_json || {}),
  ].join('||');

  return crypto.createHash('sha256').update(rawString, 'utf8').digest('hex');
}

async function seed() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/levitate3d';
  console.log(`Connecting to database: ${connectionString}`);

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Seeding demo users, orders, and WORM chain...');

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const supplierPass = await bcrypt.hash('factory123', salt);
    const customerPass = await bcrypt.hash('customer123', salt);

    // 1. Seed Users
    const adminId = '11111111-1111-1111-1111-111111111111';
    const supplierId = '22222222-2222-2222-2222-222222222222';
    const customerId = '33333333-3333-3333-3333-333333333333';

    await client.query(`
      INSERT INTO users (id, email, password_hash, role, full_name, device_token)
      VALUES 
        ('${adminId}', 'admin@levitate3d.io', '${adminPass}', 'ADMIN', 'Chief Operations Officer', NULL),
        ('${supplierId}', 'factory@3dprint-supplier.cn', '${supplierPass}', 'SUPPLIER', 'Shenzhen Precision 3D Lab', 'WIN-APP-DEMO-HARDWARE-TOKEN'),
        ('${customerId}', 'alex.mercer@gmail.com', '${customerPass}', 'CUSTOMER', 'Alex Mercer', NULL)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `);

    // 2. Seed Sample Delivered Order
    const order1Id = '44444444-4444-4444-4444-444444444444';
    const gen1Id = '55555555-5555-5555-5555-555555555555';

    await client.query(`
      INSERT INTO generations (id, user_id, prompt_type, prompt_text, status, progress, model_glb_url)
      VALUES (
        '${gen1Id}', '${customerId}', 'TEXT',
        'Cyberpunk Samurai guardian floating in meditation with glowing neon visor and internal crystal core',
        'SUCCESS', 100, '/models/sample_levitating_statue.glb'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO orders (
        id, order_number, customer_id, generation_id, base_option, internal_led_lighting,
        size, finish, designer_notes, base_price, internal_led_price, finish_price, shipping_price,
        total_price, cogs_amount, supplier_payout, tripo_api_cost, status, payment_status,
        assigned_supplier_id, carrier, tracking_number, tracking_url, share_token
      ) VALUES (
        '${order1Id}', 'LEV-2026-891042', '${customerId}', '${gen1Id}',
        'MAGNETIC_LEVITATING_BASE', TRUE, 'LARGE', 'TRANSLUCENT_GLOW',
        'Please embed 18mm magnet cavity at bottom center. Hollow chest cavity for wireless LED inductive receiver.',
        189.00, 35.00, 15.00, 15.00, 254.00, 58.00, 65.00, 0.20,
        'DELIVERED', 'PAID', '${supplierId}', 'DHL Express', 'DHL-9847291048',
        'https://www.dhl.com/en/express/tracking.html?AWB=DHL-9847291048',
        'share_alex_cyberpunk_samurai_2026'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Build WORM Hash Chain for Order 1
    console.log('Building tamper-evident cryptographic WORM chain...');
    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    let seq = 1;

    const eventsToSeed = [
      {
        role: 'CUSTOMER',
        actor: customerId,
        type: 'USER_INPUT_UPLOADED',
        payload: { prompt: 'Cyberpunk Samurai guardian floating in meditation' },
        time: '2026-11-10T10:00:00.000Z',
      },
      {
        role: 'SYSTEM',
        actor: 'TRIPO3D_ENGINE',
        type: 'TRIPO3D_MODEL_GENERATED',
        payload: { model_url: '/models/sample_levitating_statue.glb', latency_sec: 3.4 },
        time: '2026-11-10T10:00:04.000Z',
      },
      {
        role: 'CUSTOMER',
        actor: customerId,
        type: 'CUSTOMIZATION_SUBMITTED',
        payload: { size: 'LARGE', finish: 'TRANSLUCENT_GLOW', internal_led_lighting: true },
        time: '2026-11-10T10:05:00.000Z',
      },
      {
        role: 'CUSTOMER',
        actor: customerId,
        type: 'PAYMENT_AUTHORIZED_AND_CAPTURED',
        payload: { amount_usd: 254.0, payment_method: 'Stripe Card', currency: 'USD' },
        time: '2026-11-10T10:07:30.000Z',
      },
      {
        role: 'ADMIN',
        actor: adminId,
        type: 'JOB_DISPATCHED_TO_SUPPLIER',
        payload: { assigned_to: 'Shenzhen Precision 3D Lab', spec: '18mm magnet cavity + 3mm LED conduit' },
        time: '2026-11-10T11:00:00.000Z',
      },
      {
        role: 'SUPPLIER',
        actor: supplierId,
        type: 'SUPPLIER_MODEL_UPLOADED',
        payload: { model_url: '/models/refined_samurai.glb', balance_calibrated: true },
        time: '2026-11-11T09:30:00.000Z',
      },
      {
        role: 'SUPPLIER',
        actor: supplierId,
        type: 'PRODUCTION_STAGE_UPDATED',
        payload: { stage: 'PRINTING_WIRING', resin_batch: 'ClearGlow-X' },
        time: '2026-11-12T08:00:00.000Z',
      },
      {
        role: 'SUPPLIER',
        actor: supplierId,
        type: 'SHIPMENT_DISPATCHED',
        payload: { carrier: 'DHL Express', tracking: 'DHL-9847291048' },
        time: '2026-11-13T14:20:00.000Z',
      },
      {
        role: 'SYSTEM',
        actor: 'CARRIER_WEBHOOK',
        type: 'DELIVERY_CONFIRMED',
        payload: { status: 'Delivered to resident front porch', signature: 'A. Mercer' },
        time: '2026-11-15T12:00:00.000Z',
      },
    ];

    for (const item of eventsToSeed) {
      const artifactHash = crypto.createHash('sha256').update(JSON.stringify(item.payload)).digest('hex');
      const eventHash = computeEventHash({
        previous_event_hash: prevHash,
        sequence_num: seq,
        timestamp_utc: item.time,
        actor_role: item.role,
        actor_id: item.actor,
        order_id: order1Id,
        event_type: item.type,
        artifact_sha256: artifactHash,
        payload_json: item.payload,
      });

      await client.query(`
        INSERT INTO worm_audit_events (
          event_id, sequence_num, timestamp_utc, actor_role, actor_id,
          order_id, event_type, payload_json, artifact_sha256,
          previous_event_hash, event_hash
        ) VALUES (
          gen_random_uuid(), ${seq}, '${item.time}', '${item.role}', '${item.actor}',
          '${order1Id}', '${item.type}', '${JSON.stringify(item.payload)}', '${artifactHash}',
          '${prevHash}', '${eventHash}'
        ) ON CONFLICT (sequence_num) DO NOTHING;
      `);

      prevHash = eventHash;
      seq++;
    }

    console.log('Seed finished successfully! 9 chained WORM blocks generated.');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
