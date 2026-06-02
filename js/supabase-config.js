/**
 * Supabase Configuration for HOME AFRICA
 * 
 * Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your actual credentials
 * Get these from: Supabase Dashboard → Project Settings → API
 */

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://ojaofgrbyzwgwyzbyqnp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYW9mZ3JieXp3Z3d5emJ5cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjEwOTYsImV4cCI6MjA5NTM5NzA5Nn0.D1Mler_N-PQF3EOE6qnFyzYggdxHmPsxwD3k0ODIAe0'
};

// Initialize Supabase client
let supabaseClient = null;

// Check if Supabase library is loaded
if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  
  // Make it globally available
  window.supabaseClient = supabaseClient;
  
  console.log('✅ Supabase client initialized');
} else {
  console.error('❌ Supabase library not loaded. Make sure to include:');
  console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
}

/**
 * Helper function to check if Supabase is configured
 */
function isSupabaseConfigured() {
  return supabaseClient !== null && 
         SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' && 
         SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY';
}

/**
 * Helper function to get Supabase client
 */
function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured. Please update SUPABASE_CONFIG in js/supabase-config.js');
    return null;
  }
  return supabaseClient;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseClient, getSupabaseClient, isSupabaseConfigured };
}

