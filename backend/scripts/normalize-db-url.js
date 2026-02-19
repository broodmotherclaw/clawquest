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
    const username = decodeURIComponent(parsed.username || '');
    const projectRef = extractProjectRef(rawSupabaseUrl);

    if (
      parsed.hostname.toLowerCase().endsWith('pooler.supabase.com') &&
      projectRef &&
      !username.includes('.')
    ) {
      parsed.username = `${username || 'postgres'}.${projectRef}`;
      return parsed.toString();
    }

    return rawDbUrl;
  } catch {
    return rawDbUrl;
  }
}

process.stdout.write(normalizeDatabaseUrl(dbUrl, supabaseUrl));
