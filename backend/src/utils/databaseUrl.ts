export type DatabaseUrlResolution = {
  url?: string;
  source: 'DATABASE_URL' | 'POSTGRES_PRISMA_URL' | 'POSTGRES_URL_NON_POOLING' | 'POSTGRES_URL' | 'none';
  normalizedForSupabasePooler: boolean;
};

const CANDIDATE_KEYS: Array<Exclude<DatabaseUrlResolution['source'], 'none'>> = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL',
];

function extractSupabaseProjectRef(supabaseUrl?: string): string | undefined {
  if (!supabaseUrl) return undefined;

  try {
    const hostname = new URL(supabaseUrl).hostname;
    const ref = hostname.split('.')[0];
    return ref || undefined;
  } catch {
    return undefined;
  }
}

export function normalizeSupabasePoolerDatabaseUrl(
  databaseUrl?: string,
  supabaseUrl?: string
): string | undefined {
  if (!databaseUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname.toLowerCase();

    if (!host.endsWith('pooler.supabase.com')) {
      return databaseUrl;
    }

    // Supabase pooler expects the pooler port.
    if (!parsed.port || parsed.port === '5432') {
      parsed.port = '6543';
    }

    const username = decodeURIComponent(parsed.username || '');
    if (username.includes('.')) {
      return parsed.toString();
    }

    const projectRef = extractSupabaseProjectRef(supabaseUrl);
    if (!projectRef) {
      return parsed.toString();
    }

    const baseUser = username || 'postgres';
    parsed.username = `${baseUser}.${projectRef}`;
    return parsed.toString();
  } catch {
    return databaseUrl;
  }
}

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): DatabaseUrlResolution {
  let selectedKey: DatabaseUrlResolution['source'] = 'none';
  let selectedUrl: string | undefined;

  for (const key of CANDIDATE_KEYS) {
    const value = env[key];
    if (value && value.trim().length > 0) {
      selectedKey = key;
      selectedUrl = value.trim();
      break;
    }
  }

  if (!selectedUrl) {
    return {
      source: 'none',
      normalizedForSupabasePooler: false,
    };
  }

  const normalizedUrl = normalizeSupabasePoolerDatabaseUrl(selectedUrl, env.SUPABASE_URL);

  return {
    url: normalizedUrl,
    source: selectedKey,
    normalizedForSupabasePooler: normalizedUrl !== selectedUrl,
  };
}

let cachedResolution: DatabaseUrlResolution | undefined;

export function applyDatabaseUrl(env: NodeJS.ProcessEnv = process.env): DatabaseUrlResolution {
  if (!cachedResolution) {
    cachedResolution = resolveDatabaseUrl(env);
    if (cachedResolution.url) {
      env.DATABASE_URL = cachedResolution.url;
    }
  }
  return cachedResolution;
}
