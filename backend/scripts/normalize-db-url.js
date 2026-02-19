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

    if (projectRef) {
      const baseUser = (username.split('.')[0] || 'postgres').trim();
      parsed.username = `${baseUser}.${projectRef}`;
      if (!parsed.searchParams.has('options')) {
        parsed.searchParams.set('options', `project=${projectRef}`);
      }
    }

    return parsed.toString();
  } catch {
    return rawDbUrl;
  }
}

process.stdout.write(normalizeDatabaseUrl(dbUrl, supabaseUrl));
