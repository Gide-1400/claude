// Supabase Configuration for Fast Shipment Platform

// These are your PUBLIC, client-side safe credentials.
const SUPABASE_URL = 'https://chmistqmcmmmjqeanudu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobWlzdHFtY21tbWpxZWFudWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDg1MTEsImV4cCI6MjA3NjIyNDUxMX0.Ho-3nEs3_w5Xmna2z0HQF6dDjh8MkiBzD10N_6vuEKs';

// Immediately create the Supabase client and make it available globally on the `window` object.
// This is the correct way to initialize for a client-side browser application.
try {
  const { createClient } = supabase;
  window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error("Error initializing Supabase client:", e);
}