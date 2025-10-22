const supabaseUrl = 'https://chmistqmcmmmjqeanudu.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // This should be your public anon key
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

window.supabase = supabase; // Make supabase globally available