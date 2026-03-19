import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function check() {
  const { data, error } = await supabase.from('organizations').select('id, name, slug');
  console.log('Error:', error);
  console.log('Organizations:', data);
}
check();
