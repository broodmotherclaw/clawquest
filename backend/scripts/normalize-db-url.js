#!/usr/bin/env node

const dbUrl = process.argv[2] || '';
const supabaseUrl = process.argv[3] || '';

function extractProjectRef(url) {
  try {
    const host = new URL(url).hostname;
    return host.split('.')[0] || '';
  } catch {
    return '';
  }
}

function normalizeDatabaseUrl(rawDbUrl, rawSupabaseUrl) {
  try {
    const parsed = new URL(rawDbUrl);
    if (!parsed.hostname.toLowerCase().endsWith('pooler.supabase.com')) {
      return rawDbUrl;
    }

    if (!parsed.port || parsed.port === '5432') {
      parsed.port = '6543';
    }

    const username = decodeURIComponent(parsed.username || '');
    const projectRef = extractProjectRef(rawSupabaseUrl);

    if (projectRef && !username.includes('.')) {
      parsed.username = `${username || 'postgres'}.${projectRef}`;
    }

    return parsed.toString();
  } catch {
    return rawDbUrl;
  }
}

process.stdout.write(normalizeDatabaseUrl(dbUrl, supabaseUrl));
