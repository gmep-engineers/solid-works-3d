export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/levitate3d',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'levitate3d',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'levitate-super-secret-worm-jwt-key-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'levitate-super-refresh-key-2026',
  },
  tripo3d: {
    apiKey: process.env.TRIPO3D_API_KEY || '',
    apiUrl: process.env.TRIPO3D_API_URL || 'https://api.tripo3d.ai/v2/openapi',
    mockMode: process.env.TRIPO3D_MOCK_MODE !== 'false',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_stripe_secret',
    mockMode: process.env.STRIPE_MOCK_MODE !== 'false',
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucketName: process.env.S3_BUCKET_NAME || 'levitate3d-vault',
    region: process.env.S3_REGION || 'us-east-1',
    objectLockEnabled: process.env.S3_OBJECT_LOCK_ENABLED === 'true',
    localStoragePath: process.env.LOCAL_STORAGE_PATH || './uploads',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});
