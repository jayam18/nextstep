import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPgPool(): Pool | null {
  if (pool) return pool;

  const connectionString = process.env.FEEDBACK_DB_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    return null;
  }

  // Check if connection is to a hosted DB that requires SSL (e.g. Neon, Supabase)
  const isHostedDb = connectionString.includes('neon.tech') || 
                     connectionString.includes('supabase.co') ||
                     connectionString.includes('supabase.net') ||
                     connectionString.includes('aivencloud.com') ||
                     process.env.NODE_ENV === 'production'; // standard for production deployments

  pool = new Pool({
    connectionString,
    ssl: isHostedDb ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });

  return pool;
}
