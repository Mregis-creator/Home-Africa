/**
 * Supabase config is now injected by Vercel via /api/supabase-config.
 * This file remains as a fallback stub for local inspection.
 */

let supabaseClient = null;

if (typeof supabase !== 'undefined' && window.SUPABASE_CONFIG) {
  supabaseClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  window.supabaseClient = supabaseClient;
  console.log('✅ Supabase client initialized from injected config');
} else {
  console.warn('⚠️ Supabase client is not initialized in js/supabase-config.js.');
  console.warn('If you are deploying to Vercel, make sure the route /js/supabase-config.js is rewritten to /api/supabase-config.');
}

function isSupabaseConfigured() {
  return supabaseClient !== null &&
         window.SUPABASE_CONFIG &&
         window.SUPABASE_CONFIG.url &&
         window.SUPABASE_CONFIG.anonKey;
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please ensure the config route is active and environment variables are set.');
    return null;
  }
  return supabaseClient;
}

if (typeof window !== 'undefined') {
  window.getSupabaseClient = getSupabaseClient;
  window.isSupabaseConfigured = isSupabaseConfigured;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseClient, getSupabaseClient, isSupabaseConfigured };
}

