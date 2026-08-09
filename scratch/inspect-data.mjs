import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dkiunmuwdkajxsvowuvy.supabase.co',
  'sb_publishable_WkV3rMcC82ubAiTGRAjsWA_G8ChCwn2'
);

async function inspectData() {
  const { data: users } = await supabase.from('users').select('*');
  console.log('--- USERS ---');
  console.log(users);

  const { data: reports } = await supabase.from('reports').select('id, reportid, userid, category, imageurl').limit(5);
  console.log('--- SAMPLE REPORTS ---');
  console.log(reports);
}

inspectData();
