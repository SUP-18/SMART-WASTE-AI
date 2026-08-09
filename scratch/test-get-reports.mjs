import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dkiunmuwdkajxsvowuvy.supabase.co',
  'sb_publishable_WkV3rMcC82ubAiTGRAjsWA_G8ChCwn2'
);

async function testGetReports() {
  console.log('Testing getReports for userid=1 with lowercase column filter...');
  const { data, count, error } = await supabase
    .from('reports')
    .select('*, users(name)', { count: 'exact' })
    .eq('userid', 1);

  if (error) {
    console.error('❌ Error fetching user reports:', error);
  } else {
    console.log(`✅ Found ${data.length} reports for userid 1 (total count: ${count})`);
    if (data.length > 0) {
      console.log('Sample report:', {
        id: data[0].id,
        reportid: data[0].reportid,
        category: data[0].category,
        imageurl: data[0].imageurl ? data[0].imageurl.substring(0, 40) + '...' : 'none'
      });
    }
  }
}

testGetReports();
