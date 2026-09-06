const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// The Service Role Key allows backend to bypass RLS (Row Level Security)
// DO NOT use this on the frontend!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabaseAdmin;
