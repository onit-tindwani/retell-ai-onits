require('dotenv').config();
console.log('Current directory:', process.cwd());
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Key is present' : 'Key is missing'); 