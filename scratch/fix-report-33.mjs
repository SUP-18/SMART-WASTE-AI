import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dkiunmuwdkajxsvowuvy.supabase.co',
  'sb_publishable_WkV3rMcC82ubAiTGRAjsWA_G8ChCwn2'
);

async function fixReportImages() {
  console.log('Fixing report #33 and #32 image URLs in Supabase...');
  const { error: err1 } = await supabase
    .from('reports')
    .update({ imageurl: '/uploads/demo/pothole.jpg' })
    .eq('id', 33);
  if (err1) console.error('Error updating 33:', err1);
  else console.log('✅ Report #33 updated to pothole image!');

  const { error: err2 } = await supabase
    .from('reports')
    .update({ imageurl: '/uploads/demo/pothole.jpg' })
    .eq('id', 32);
  if (err2) console.error('Error updating 32:', err2);
  else console.log('✅ Report #32 updated to pothole image!');
}

fixReportImages();
