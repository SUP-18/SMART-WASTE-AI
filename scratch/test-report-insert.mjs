import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dkiunmuwdkajxsvowuvy.supabase.co',
  'sb_publishable_WkV3rMcC82ubAiTGRAjsWA_G8ChCwn2'
);

async function testCamelInsert() {
  console.log('Testing insert with camelCase keys...');
  const row = {
    reportId: '#SW-9999',
    userId: 1,
    category: 'Pothole',
    description: 'Test pothole submission',
    latitude: 17.3411,
    longitude: 78.5682,
    locationText: 'Lat: 17.3411, Lng: 78.5682',
    peopleAffected: '6-20',
    locationType: 'Public Road',
    priorityScore: 60,
    priorityLevel: 'Medium',
    aiConfidence: 0.91,
    status: 'Pending',
    upvoteCount: 0,
    imageUrl: '/uploads/demo/pothole.jpg',
  };

  const { data, error } = await supabase.from('reports').insert([row]).select().single();
  if (error) {
    console.error('❌ Insert failed:', error.message, error.code);
  } else {
    console.log('✅ Insert successful! Inserted ID:', data.id);
  }
}

testCamelInsert();
