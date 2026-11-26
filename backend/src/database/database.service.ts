import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { REGISTERED_MANUFACTURERS } from '../modules/supplier/manufacturers.constants';
import { DEFAULT_FAQS } from '../modules/faq/faq.constants';
import { DEFAULT_EXCHANGE_RATES, CurrencyRate } from '../modules/supplier/currency.constants';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const dbConfig = this.configService.get('database');
    this.pool = new Pool({
      connectionString: dbConfig.url,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await this.pool.connect();
      this.isConnected = true;
      this.logger.log('Connected to PostgreSQL successfully.');
      client.release();
      await this.runMigrations();
    } catch (err) {
      this.logger.warn(`PostgreSQL connection failed (${err.message}). Using persistent file fallback store for standalone development mode.`);
      this.isConnected = false;
      this.initDevStore();
    }
  }

  private devStorePath = path.resolve(process.cwd(), 'uploads', 'dev_store.json');

  private initDevStore() {
    try {
      const dir = path.dirname(this.devStorePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.devStorePath)) {
        const raw = fs.readFileSync(this.devStorePath, 'utf8');
        const data = JSON.parse(raw);
        if (data.users) {
          data.users.forEach((u: any) => this.memoryStore.users.set(u.id, u));
        }
        if (data.generations) {
          data.generations.forEach((g: any) => this.memoryStore.generations.set(g.id, g));
        }
        if (data.orders) {
          data.orders.forEach((o: any) => this.memoryStore.orders.set(o.id, o));
        }
        if (data.worm_audit_events) {
          this.memoryStore.worm_audit_events = data.worm_audit_events;
        }
        if (data.manufacturers && Array.isArray(data.manufacturers)) {
          data.manufacturers.forEach((m: any) => {
            if (!m.category) m.category = '3D_PRINTING';
            const seed = REGISTERED_MANUFACTURERS.find(s => s.id === m.id);
            if (!m.currency && seed) m.currency = seed.currency;
            if (!m.country && seed) m.country = seed.country;
            this.memoryStore.manufacturers.set(m.id, m);
          });
          // Ensure newly registered vendor templates (e.g. 3D Designers) are populated
          REGISTERED_MANUFACTURERS.forEach((seedM: any) => {
            if (!this.memoryStore.manufacturers.has(seedM.id)) {
              this.memoryStore.manufacturers.set(seedM.id, { ...seedM });
            }
          });
        } else {
          REGISTERED_MANUFACTURERS.forEach((m: any) => this.memoryStore.manufacturers.set(m.id, { ...m }));
        }
        if (data.exchange_rates && typeof data.exchange_rates === 'object') {
          this.memoryStore.exchange_rates = { ...DEFAULT_EXCHANGE_RATES, ...data.exchange_rates };
        } else {
          this.memoryStore.exchange_rates = { ...DEFAULT_EXCHANGE_RATES };
        }
        if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
          data.faqs.forEach((f: any) => this.memoryStore.faqs.set(f.id, f));
        } else {
          DEFAULT_FAQS.forEach((f: any) => this.memoryStore.faqs.set(f.id, { ...f }));
        }
        this.persistDevStore();
        this.logger.log(`Loaded ${this.memoryStore.orders.size} orders, ${this.memoryStore.manufacturers.size} vendors, and ${this.memoryStore.faqs.size} FAQs from persistent dev store.`);
        return;
      }
    } catch (e) {
      this.logger.warn('Failed to load dev store from file, initializing seeds:', e.message);
    }

    this.seedDefaultDevData();
  }

  public persistDevStore() {
    try {
      const dir = path.dirname(this.devStorePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        users: Array.from(this.memoryStore.users.values()),
        generations: Array.from(this.memoryStore.generations.values()),
        orders: Array.from(this.memoryStore.orders.values()),
        manufacturers: Array.from(this.memoryStore.manufacturers.values()),
        worm_audit_events: this.memoryStore.worm_audit_events,
        faqs: Array.from(this.memoryStore.faqs.values()),
        exchange_rates: this.memoryStore.exchange_rates,
      };
      fs.writeFileSync(this.devStorePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      this.logger.warn('Failed to persist dev store:', e.message);
    }
  }

  private seedDefaultDevData() {
    const alexUserId = 'd3308d56-daa0-4de5-8455-6ffdca8184f9';
    this.memoryStore.users.set(alexUserId, {
      id: alexUserId,
      email: 'alex.mercer@gmail.com',
      full_name: 'Alex Mercer',
      role: 'CUSTOMER',
    });

    const adminUserId = '11111111-1111-1111-1111-111111111111';
    this.memoryStore.users.set(adminUserId, {
      id: adminUserId,
      email: 'admin@levitate3d.io',
      full_name: 'Chief Operations Officer',
      role: 'ADMIN',
    });

    // Seed Generation: Happy Running Dog
    const dogGenId = 'cb60724d-ff1b-45ca-b2fe-56a1179374b9';
    this.memoryStore.generations.set(dogGenId, {
      id: dogGenId,
      user_id: alexUserId,
      prompt_type: 'TEXT',
      prompt_text: 'A happy running dog, Golden yellow fur, Detailed fur texture',
      status: 'SUCCESS',
      progress: 100,
      model_glb_url: 'http://localhost:4000/api/v1/storage/models/aafc6805-1c9e-4931-a359-10f8c704d3f7.glb',
      model_thumbnail_url: 'http://localhost:4000/api/v1/storage/thumbnails/aafc6805-1c9e-4931-a359-10f8c704d3f7.webp',
      model_sha256: '545ff1ab43a56ddd12f698ec2746b5774c0a2c1dbf3dbd0dc100b2de61bec731',
    });

    // Seed Order: Happy Running Dog
    const dogOrderId = 'd2b4ecf8-bd76-4972-88d8-3d8ac8da5bfd';
    this.memoryStore.orders.set(dogOrderId, {
      id: dogOrderId,
      order_number: 'LEV-2026-691551',
      customer_id: alexUserId,
      generation_id: dogGenId,
      base_option: 'MAGNETIC_LEVITATING_BASE',
      internal_led_lighting: false,
      size: 'STANDARD',
      finish: 'FULL_COLOR',
      total_price: 199,
      cogs_amount: 40,
      supplier_payout: 50,
      tripo_api_cost: 0.2,
      status: 'DESIGNER_REFINING',
      payment_status: 'PAID',
      supplier_stage: 'NEEDS_REFINEMENT',
      share_token: 'share_01db158f8925c6caad70dbc3',
      created_at: '2026-11-18T00:28:57.207Z',
      updated_at: '2026-11-18T00:28:57.220Z',
    });

    // Seed Order: Cyberpunk Samurai Guardian
    const samuraiOrderId = '44444444-4444-4444-4444-444444444444';
    this.memoryStore.orders.set(samuraiOrderId, {
      id: samuraiOrderId,
      order_number: 'LEV-2026-891042',
      customer_id: alexUserId,
      base_option: 'MAGNETIC_LEVITATING_BASE',
      internal_led_lighting: true,
      size: 'LARGE',
      finish: 'TRANSLUCENT_GLOW',
      total_price: 254,
      cogs_amount: 55,
      supplier_payout: 60,
      tripo_api_cost: 0.2,
      status: 'DELIVERED',
      payment_status: 'PAID',
      supplier_stage: 'DELIVERED',
      share_token: 'share_alex_cyberpunk_samurai_2026',
      created_at: '2026-11-16T12:00:00.000Z',
      updated_at: '2026-11-16T18:00:00.000Z',
    });

    // Seed Default Manufacturers
    REGISTERED_MANUFACTURERS.forEach((m: any) => {
      this.memoryStore.manufacturers.set(m.id, { ...m });
    });

    // Seed Default FAQs
    DEFAULT_FAQS.forEach((f: any) => {
      this.memoryStore.faqs.set(f.id, { ...f });
    });

    this.persistDevStore();
    this.logger.log('Seeded default development orders including Happy Running Dog (LEV-2026-691551) and FAQs.');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  get isPostgresConnected(): boolean {
    return this.isConnected;
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isConnected) {
      return this.executeMockQuery<T>(text, params);
    }
    return this.pool.query<T>(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  private async runMigrations() {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await this.pool.query(sql);
        this.logger.log('Database migrations and WORM triggers applied successfully.');
      }
    } catch (err) {
      this.logger.error('Failed to run migrations: ' + err.message);
    }
  }

  // Standalone in-memory fallback state for when Postgres is not running locally during development
  private memoryStore = {
    users: new Map<string, any>(),
    generations: new Map<string, any>(),
    orders: new Map<string, any>(),
    manufacturers: new Map<string, any>(),
    worm_audit_events: [] as any[],
    job_messages: [] as any[],
    faqs: new Map<string, any>(),
    exchange_rates: { ...DEFAULT_EXCHANGE_RATES } as Record<string, CurrencyRate>,
  };

  private executeMockQuery<T = any>(sql: string, params: any[] = []): QueryResult<T> {
    const normalized = sql.trim().toUpperCase();
    const rows: any[] = [];

    // Helper to simulate basic SQL queries in fallback
    if (normalized.startsWith('SELECT') && normalized.includes('FROM WORM_AUDIT_EVENTS')) {
      if (normalized.includes('WHERE ORDER_ID = $1')) {
        const orderId = params[0];
        const matched = this.memoryStore.worm_audit_events.filter(e => e.order_id === orderId);
        return { rows: matched as unknown as T[], rowCount: matched.length } as any;
      }
      return { rows: [...this.memoryStore.worm_audit_events] as unknown as T[], rowCount: this.memoryStore.worm_audit_events.length } as any;
    }

    if (normalized.startsWith('SELECT') && normalized.includes('FROM USERS')) {
      if (normalized.includes('WHERE EMAIL = $1')) {
        const user = Array.from(this.memoryStore.users.values()).find(u => u.email === params[0]);
        const r = user ? [user] : [];
        return { rows: r as unknown as T[], rowCount: r.length } as any;
      }
      if (normalized.includes('WHERE ID = $1')) {
        const user = this.memoryStore.users.get(params[0]);
        const r = user ? [user] : [];
        return { rows: r as unknown as T[], rowCount: r.length } as any;
      }
      return { rows: Array.from(this.memoryStore.users.values()) as unknown as T[], rowCount: this.memoryStore.users.size } as any;
    }

    if (normalized.startsWith('SELECT') && normalized.includes('FROM ORDERS')) {
      if (normalized.includes('WHERE ID = $1')) {
        const order = this.memoryStore.orders.get(params[0]);
        const r = order ? [order] : [];
        return { rows: r as unknown as T[], rowCount: r.length } as any;
      }
      if (normalized.includes('WHERE ASSIGNED_SUPPLIER_ID = $1') || normalized.includes('WHERE ASSIGNED_SUPPLIER_ID IS NOT NULL')) {
        const orders = Array.from(this.memoryStore.orders.values());
        return { rows: orders as unknown as T[], rowCount: orders.length } as any;
      }
      return { rows: Array.from(this.memoryStore.orders.values()) as unknown as T[], rowCount: this.memoryStore.orders.size } as any;
    }

    return { rows: rows as unknown as T[], rowCount: rows.length } as any;
  }

  getMemoryStore() {
    return this.memoryStore;
  }
}
