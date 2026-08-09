import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dkiunmuwdkajxsvowuvy.supabase.co',
  'sb_publishable_WkV3rMcC82ubAiTGRAjsWA_G8ChCwn2'
);

const demoReports = [
  {
    reportid: '#SW-1001',
    category: 'Overflowing Bin',
    description: 'Garbage bin overflowing near metro station entrance. Waste scattered on pavement causing hygiene concerns for commuters.',
    imageurl: '/uploads/demo/overflowing_bin.jpg',
    latitude: 28.6145,
    longitude: 77.2085,
    locationtext: 'Central Secretariat Metro Station',
    priorityscore: 72,
    prioritylevel: 'High',
    peopleaffected: '50+',
    locationtype: 'Public Road',
    status: 'Pending',
    upvotecount: 12,
    aiconfidence: 0.92,
  },
  {
    reportid: '#SW-1002',
    category: 'Water Leakage',
    description: 'Major water pipe burst on main road. Clean water being wasted continuously for the last 2 days. Road is flooded.',
    imageurl: '/uploads/demo/water_leakage.jpg',
    latitude: 28.6120,
    longitude: 77.2100,
    locationtext: 'Connaught Place Block A',
    priorityscore: 88,
    prioritylevel: 'High',
    peopleaffected: '50+',
    locationtype: 'Market',
    status: 'In Progress',
    assignedto: 'Water Dept Team A',
    upvotecount: 45,
    aiconfidence: 0.95,
  },
  {
    reportid: '#SW-1003',
    category: 'Illegal Dumping',
    description: 'Construction debris and household waste dumped illegally near the park entrance overnight. Blocking pedestrian path.',
    imageurl: '/uploads/demo/illegal_dumping.jpg',
    latitude: 28.6160,
    longitude: 77.2120,
    locationtext: 'Lodhi Garden Area',
    priorityscore: 65,
    prioritylevel: 'Medium',
    peopleaffected: '21-50',
    locationtype: 'Park',
    status: 'Assigned',
    assignedto: 'Sanitation Team B',
    upvotecount: 22,
    aiconfidence: 0.89,
  },
  {
    reportid: '#SW-1004',
    category: 'Pothole',
    description: 'Deep pothole on main road causing traffic jams and risk of vehicle damage. Multiple accidents reported in the area.',
    imageurl: '/uploads/demo/pothole.jpg',
    latitude: 28.6105,
    longitude: 77.2050,
    locationtext: 'Janpath Road',
    priorityscore: 80,
    prioritylevel: 'High',
    peopleaffected: '50+',
    locationtype: 'Public Road',
    status: 'In Progress',
    assignedto: 'PWD Ward 4',
    upvotecount: 34,
    aiconfidence: 0.93,
  },
  {
    reportid: '#SW-1005',
    category: 'Street Waste',
    description: 'Plastic wrappers, cups, and food waste scattered across the street outside the school zone. Children walking through the waste daily.',
    imageurl: '/uploads/demo/street_waste.jpg',
    latitude: 28.6180,
    longitude: 77.2060,
    locationtext: 'Gole Market School Zone',
    priorityscore: 58,
    prioritylevel: 'Medium',
    peopleaffected: '6-20',
    locationtype: 'School/College',
    status: 'Resolved',
    assignedto: 'Sanitation Team C',
    upvotecount: 8,
    aiconfidence: 0.87,
    resolvedat: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    reportid: '#SW-1006',
    category: 'Overflowing Bin',
    description: 'Community dustbin not emptied for a week. Stray dogs and crows spreading garbage across the residential area.',
    imageurl: '/uploads/demo/overflowing_bin.jpg',
    latitude: 28.6200,
    longitude: 77.2150,
    locationtext: 'India Gate Circle',
    priorityscore: 42,
    prioritylevel: 'Medium',
    peopleaffected: '6-20',
    locationtype: 'Residential',
    status: 'Pending',
    upvotecount: 6,
    aiconfidence: 0.90,
  },
  {
    reportid: '#SW-1007',
    category: 'Pothole',
    description: 'Large pothole filled with rainwater creating dangerous conditions for two-wheelers and pedestrians.',
    imageurl: '/uploads/demo/pothole.jpg',
    latitude: 28.6150,
    longitude: 77.2030,
    locationtext: 'Parliament Street',
    priorityscore: 76,
    prioritylevel: 'High',
    peopleaffected: '21-50',
    locationtype: 'Public Road',
    status: 'Resolved',
    assignedto: 'PWD Ward 1',
    upvotecount: 40,
    aiconfidence: 0.91,
    resolvedat: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    reportid: '#SW-1008',
    category: 'Water Leakage',
    description: 'Sewer water leaking onto the main commercial street. Strong odor affecting nearby shops and restaurants.',
    imageurl: '/uploads/demo/water_leakage.jpg',
    latitude: 28.6110,
    longitude: 77.2180,
    locationtext: 'Khan Market',
    priorityscore: 90,
    prioritylevel: 'High',
    peopleaffected: '50+',
    locationtype: 'Market',
    status: 'Assigned',
    assignedto: 'Water Dept Team B',
    upvotecount: 55,
    aiconfidence: 0.94,
  },
  {
    reportid: '#SW-1009',
    category: 'Illegal Dumping',
    description: 'Old furniture and electronic waste abandoned on the sidewalk blocking pedestrian movement.',
    imageurl: '/uploads/demo/illegal_dumping.jpg',
    latitude: 28.6080,
    longitude: 77.2090,
    locationtext: 'Mandi House',
    priorityscore: 35,
    prioritylevel: 'Low',
    peopleaffected: '1-5',
    locationtype: 'Public Road',
    status: 'Pending',
    upvotecount: 5,
    aiconfidence: 0.86,
  },
  {
    reportid: '#SW-1010',
    category: 'Other',
    description: 'Broken street light creating an unsafe dark zone at night. Multiple residents have reported feeling unsafe walking here after 7 PM.',
    imageurl: '/uploads/demo/street_light.jpg',
    latitude: 28.6210,
    longitude: 77.2040,
    locationtext: 'Baba Kharak Singh Marg',
    priorityscore: 62,
    prioritylevel: 'Medium',
    peopleaffected: '21-50',
    locationtype: 'Public Road',
    status: 'Pending',
    upvotecount: 18,
    aiconfidence: 0.88,
  },
];

async function seed() {
  console.log('🌱 Seeding demo reports into Supabase...\n');

  // Get existing users
  const { data: users } = await supabase.from('users').select('id, role');
  if (!users || users.length === 0) {
    console.error('❌ No users found in database. Please insert demo users first.');
    return;
  }

  const citizenIds = users.filter(u => u.role === 'citizen').map(u => u.id);
  const adminIds = users.filter(u => u.role === 'admin').map(u => u.id);

  if (citizenIds.length === 0) {
    console.error('❌ No citizen users found. Please insert a citizen user first.');
    return;
  }

  console.log(`Found ${citizenIds.length} citizen(s) and ${adminIds.length} admin(s)\n`);

  let successCount = 0;
  const now = new Date();

  for (let i = 0; i < demoReports.length; i++) {
    const report = demoReports[i];
    const daysAgo = Math.floor(Math.random() * 7) + 1;
    const createdAt = new Date(now.getTime() - daysAgo * 86400000).toISOString();

    const row = {
      ...report,
      userid: citizenIds[i % citizenIds.length],
      createdat: createdAt,
      updatedat: createdAt,
    };

    const { error } = await supabase.from('reports').upsert([row], { onConflict: 'reportid' });

    if (error) {
      console.error(`❌ Failed to insert ${report.reportid}:`, error.message);
    } else {
      console.log(`✅ ${report.reportid} - ${report.category} @ ${report.locationtext}`);
      successCount++;
    }
  }

  // Create notifications for the citizen users
  for (const cid of citizenIds) {
    await supabase.from('notifications').insert([
      { userid: cid, message: 'Welcome to SmartWaste AI! Start reporting issues in your area.', type: 'info' },
    ]);
  }

  // Create admin notifications
  for (const aid of adminIds) {
    await supabase.from('notifications').insert([
      { userid: aid, message: `${successCount} new reports have been submitted by citizens.`, type: 'new_report' },
    ]);
  }

  console.log(`\n🎉 Seeding complete! ${successCount}/${demoReports.length} reports inserted.`);
}

seed();
