import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from cwd and root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mobileUrl: process.env.MOBILE_URL || 'http://localhost:3001',

  // Database & Supabase
  databaseUrl: process.env.DATABASE_URL || '',
  pgDataDir: process.env.PGLITE_DATA_DIR || path.resolve(process.cwd(), 'data/pglite_db'),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  supabaseSecretKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '',

  // JWT & Security
  jwtSecret: process.env.JWT_SECRET || 'bpf_super_secret_jwt_access_token_key_2026_x89f',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'bpf_super_secret_jwt_refresh_token_key_2026_z12m',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'bpf_cookie_secure_signer_9921_secret',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',

  // Face Verification & Biometrics
  faceThreshold: parseFloat(process.env.FACE_VERIFICATION_THRESHOLD || '0.82'),
  faceLivenessEnabled: process.env.FACE_LIVENESS_ENABLED === 'true',
  faceMaxRetry: parseInt(process.env.FACE_MAX_RETRY || '3', 10),

  // Company Locale Defaults
  timezone: process.env.COMPANY_DEFAULT_TIMEZONE || 'Asia/Kolkata',
  currency: process.env.DEFAULT_CURRENCY || 'INR',
  defaultGeofenceRadius: parseInt(process.env.DEFAULT_GEOFENCE_RADIUS_METERS || '100', 10),

  // File Storage
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || 'uploads'),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)
};
