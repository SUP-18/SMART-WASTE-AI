import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dkiunmuwdkajxsvowuvy.supabase.co',
  'sb_publishable_WkV3rMcC82ubAiTGRAjsWA_G8ChCwn2'
);

async function testCreateUser() {
  console.log('Testing user creation with ecopoints lowercase column...');
  const { data, error } = await supabase
    .from('users')
    .insert([{ name: 'Test User', email: 'testuser_scratch@gmail.com', password: 'password123', role: 'citizen', ecopoints: 0 }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating user:', error);
  } else {
    console.log('✅ User created successfully! ID:', data.id);
    // Cleanup
    await supabase.from('users').delete().eq('id', data.id);
    console.log('Cleaned up test user.');
  }
}

testCreateUser();
