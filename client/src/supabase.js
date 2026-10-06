import { createClient } from '@supabase/supabase-js';

// Default Supabase Cloud Database Credentials provided for STIC
export const DEFAULT_SUPABASE_URL = 'https://ymmomauxfwnbqkmuxncw.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_t-RyKUjbY2rllypPK_PeUw_ibvV3djU';

// Retrieve credentials from localStorage, Vite environment variables, or defaults
export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('stic_supabase_url');
  const localKey = localStorage.getItem('stic_supabase_key');
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const url = (localUrl && localUrl.trim() !== '' ? localUrl : (envUrl || DEFAULT_SUPABASE_URL)).trim();
  const key = (localKey && localKey.trim() !== '' ? localKey : (envKey || DEFAULT_SUPABASE_KEY)).trim();

  return {
    url,
    key,
    isFromEnv: Boolean(!localUrl && (envUrl || DEFAULT_SUPABASE_URL))
  };
};

let cachedClient = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) return null;

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('[Supabase Init Error]', err);
    return null;
  }
};

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

export const saveSupabaseConfig = (url, key) => {
  if (url) localStorage.setItem('stic_supabase_url', url.trim());
  else localStorage.removeItem('stic_supabase_url');

  if (key) localStorage.setItem('stic_supabase_key', key.trim());
  else localStorage.removeItem('stic_supabase_key');

  cachedClient = null;
  window.dispatchEvent(new CustomEvent('stic_supabase_updated'));
};

export const testSupabaseConnection = async (testUrl, testKey) => {
  try {
    const client = createClient(testUrl.trim(), testKey.trim());
    const { data, error } = await client.from('club_members').select('id, full_name, college_id').limit(1);
    if (error) {
      // Check if table exists or connection refused
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but "club_members" table was not found. Please run the supabase_schema.sql script in your Supabase SQL Editor.'
        };
      }
      return { success: false, message: error.message };
    }
    return {
      success: true,
      message: 'Connection to Supabase successful! Table "club_members" is accessible.'
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
};
