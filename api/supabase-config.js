export default function handler(request, response) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    response.status(500).setHeader('Content-Type', 'application/javascript');
    response.send("console.error('Supabase config not available: missing SUPABASE_URL or SUPABASE_ANON_KEY.');");
    return;
  }

  response.setHeader('Content-Type', 'application/javascript');
  response.send(`
    const SUPABASE_CONFIG = {
      url: '${SUPABASE_URL.replace(/'/g, "\\'")}',
      anonKey: '${SUPABASE_ANON_KEY.replace(/'/g, "\\'")}'
    };

    let supabaseClient = null;
    if (typeof supabase !== 'undefined') {
      supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      window.supabaseClient = supabaseClient;
      console.log('✅ Supabase client initialized');
    } else {
      console.error('❌ Supabase library not loaded. Include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    }

    function isSupabaseConfigured() {
      return supabaseClient !== null &&
             SUPABASE_CONFIG.url &&
             SUPABASE_CONFIG.anonKey;
    }

    function getSupabaseClient() {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your deployment environment.');
        return null;
      }
      return supabaseClient;
    }

    if (typeof window !== 'undefined') {
      window.SUPABASE_CONFIG = SUPABASE_CONFIG;
      window.getSupabaseClient = getSupabaseClient;
      window.isSupabaseConfigured = isSupabaseConfigured;
    }
  `);
}
