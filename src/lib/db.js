import Database from 'better-sqlite3';
import path from 'path';

let db = null;

function getDb() {
  if (db) return db;
  
  // Create or open the database in the project root
  db = new Database(path.join(process.cwd(), 'smartwaste.db'));
  
  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'citizen',
      ecoPoints INTEGER DEFAULT 0,
      badges TEXT DEFAULT '[]',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportId TEXT UNIQUE NOT NULL,
      userId INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      imageUrl TEXT,
      afterImageUrl TEXT,
      latitude REAL,
      longitude REAL,
      locationText TEXT,
      priorityScore INTEGER DEFAULT 50,
      priorityLevel TEXT DEFAULT 'Medium',
      peopleAffected TEXT DEFAULT '1-5',
      locationType TEXT DEFAULT 'Public Road',
      status TEXT DEFAULT 'Pending',
      assignedTo TEXT,
      upvoteCount INTEGER DEFAULT 0,
      aiConfidence REAL DEFAULT 0.85,
      resolvedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      reportId TEXT,
      read INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reportId, userId),
      FOREIGN KEY (reportId) REFERENCES reports(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  seedDatabase(db);
  
  return db;
}

function seedDatabase(db) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return; // Already seeded

  console.log('Seeding database with demo data...');

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, ecoPoints) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 1. Users
  insertUser.run(1, 'Alex Johnson', 'demo@citizen.com', 'demo123', 'citizen', 420);
  insertUser.run(2, 'Sarah Admin', 'admin@smartwaste.com', 'admin123', 'admin', 0);
  insertUser.run(3, 'Priya Sharma', 'priya@citizen.com', 'demo123', 'citizen', 350);
  insertUser.run(4, 'Marcus Chen', 'marcus@citizen.com', 'demo123', 'citizen', 280);
  insertUser.run(5, 'Emily Davis', 'emily@citizen.com', 'demo123', 'citizen', 195);
  insertUser.run(6, 'Raj Patel', 'raj@citizen.com', 'demo123', 'citizen', 150);
  insertUser.run(7, 'John Doe', 'john@citizen.com', 'demo123', 'citizen', 50);

  // 2. Reports
  const insertReport = db.prepare(`
    INSERT INTO reports (reportId, userId, category, description, imageUrl, afterImageUrl, latitude, longitude, locationText, priorityScore, priorityLevel, peopleAffected, locationType, status, assignedTo, upvoteCount, resolvedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // Generating 12 reports around Delhi (28.6139, 77.2090)
  const reportsData = [
    {
      reportId: '#SW-1001', userId: 1, category: 'Overflowing Bin', description: 'Bin overflowing since 3 days near metro station.', 
      imageUrl: '/uploads/demo/bin1.svg', afterImageUrl: null, 
      latitude: 28.6145, longitude: 77.2085, locationText: 'Central Secretariat Metro',
      priorityScore: 55, priorityLevel: 'Medium', peopleAffected: '50+', locationType: 'Public Road',
      status: 'Pending', assignedTo: null, upvoteCount: 12, resolvedAt: null, createdAt: daysAgo(2)
    },
    {
      reportId: '#SW-1002', userId: 3, category: 'Water Leakage', description: 'Major pipe burst wasting clean water.', 
      imageUrl: '/uploads/demo/leak1.svg', afterImageUrl: '/uploads/demo/leak1_fixed.svg', 
      latitude: 28.6120, longitude: 77.2100, locationText: 'Connaught Place Block A',
      priorityScore: 85, priorityLevel: 'High', peopleAffected: '50+', locationType: 'Market',
      status: 'Resolved', assignedTo: 'Water Dept Team A', upvoteCount: 45, resolvedAt: daysAgo(1), createdAt: daysAgo(5)
    },
    {
      reportId: '#SW-1003', userId: 4, category: 'Illegal Dumping', description: 'Construction waste dumped overnight in the park.', 
      imageUrl: '/uploads/demo/dump1.svg', afterImageUrl: null, 
      latitude: 28.6160, longitude: 77.2120, locationText: 'Lodhi Garden Area',
      priorityScore: 65, priorityLevel: 'Medium', peopleAffected: '21-50', locationType: 'Park',
      status: 'Assigned', assignedTo: 'Sanitation Team B', upvoteCount: 22, resolvedAt: null, createdAt: daysAgo(3)
    },
    {
      reportId: '#SW-1004', userId: 5, category: 'Pothole', description: 'Dangerous pothole on main road causing traffic delays.', 
      imageUrl: '/uploads/demo/pothole1.svg', afterImageUrl: null, 
      latitude: 28.6105, longitude: 77.2050, locationText: 'Janpath Road',
      priorityScore: 75, priorityLevel: 'High', peopleAffected: '50+', locationType: 'Public Road',
      status: 'In Progress', assignedTo: 'PWD Ward 4', upvoteCount: 34, resolvedAt: null, createdAt: daysAgo(1)
    },
    {
      reportId: '#SW-1005', userId: 6, category: 'Street Waste', description: 'Plastic wrappers and cups scattered outside school.', 
      imageUrl: '/uploads/demo/street1.svg', afterImageUrl: '/uploads/demo/street1_clean.svg', 
      latitude: 28.6180, longitude: 77.2060, locationText: 'Gole Market School Zone',
      priorityScore: 45, priorityLevel: 'Medium', peopleAffected: '6-20', locationType: 'School/College',
      status: 'Resolved', assignedTo: 'Sanitation Team C', upvoteCount: 8, resolvedAt: daysAgo(2), createdAt: daysAgo(6)
    },
    {
      reportId: '#SW-1006', userId: 1, category: 'Overflowing Bin', description: 'Garbage bin not emptied. Stray dogs spreading trash.', 
      imageUrl: '/uploads/demo/bin2.svg', afterImageUrl: null, 
      latitude: 28.6200, longitude: 77.2150, locationText: 'India Gate Circle',
      priorityScore: 35, priorityLevel: 'Low', peopleAffected: '1-5', locationType: 'Park',
      status: 'Pending', assignedTo: null, upvoteCount: 2, resolvedAt: null, createdAt: daysAgo(0)
    },
    {
      reportId: '#SW-1007', userId: 3, category: 'Pothole', description: 'Deep pothole filled with water.', 
      imageUrl: '/uploads/demo/pothole2.svg', afterImageUrl: '/uploads/demo/pothole2_fixed.svg', 
      latitude: 28.6150, longitude: 77.2030, locationText: 'Parliament Street',
      priorityScore: 80, priorityLevel: 'High', peopleAffected: '21-50', locationType: 'Public Road',
      status: 'Resolved', assignedTo: 'PWD Ward 1', upvoteCount: 40, resolvedAt: daysAgo(3), createdAt: daysAgo(7)
    },
    {
      reportId: '#SW-1008', userId: 4, category: 'Water Leakage', description: 'Sewer water overflowing onto the street.', 
      imageUrl: '/uploads/demo/leak2.svg', afterImageUrl: null, 
      latitude: 28.6110, longitude: 77.2180, locationText: 'Khan Market',
      priorityScore: 90, priorityLevel: 'High', peopleAffected: '50+', locationType: 'Market',
      status: 'In Progress', assignedTo: 'Water Dept Team B', upvoteCount: 55, resolvedAt: null, createdAt: daysAgo(2)
    },
    {
      reportId: '#SW-1009', userId: 5, category: 'Illegal Dumping', description: 'Furniture abandoned on the sidewalk.', 
      imageUrl: '/uploads/demo/dump2.svg', afterImageUrl: null, 
      latitude: 28.6080, longitude: 77.2090, locationText: 'Mandi House',
      priorityScore: 30, priorityLevel: 'Low', peopleAffected: '1-5', locationType: 'Public Road',
      status: 'Pending', assignedTo: null, upvoteCount: 5, resolvedAt: null, createdAt: daysAgo(1)
    },
    {
      reportId: '#SW-1010', userId: 6, category: 'Street Waste', description: 'Fallen tree branches blocking pedestrian path.', 
      imageUrl: '/uploads/demo/street2.svg', afterImageUrl: null, 
      latitude: 28.6190, longitude: 77.2110, locationText: 'Ashoka Road',
      priorityScore: 50, priorityLevel: 'Medium', peopleAffected: '6-20', locationType: 'Public Road',
      status: 'Assigned', assignedTo: 'Horticulture Dept', upvoteCount: 15, resolvedAt: null, createdAt: daysAgo(4)
    },
    {
      reportId: '#SW-1011', userId: 1, category: 'Other', description: 'Broken street light creating unsafe dark spot.', 
      imageUrl: '/uploads/demo/other1.svg', afterImageUrl: null, 
      latitude: 28.6210, longitude: 77.2040, locationText: 'Baba Kharak Singh Marg',
      priorityScore: 60, priorityLevel: 'Medium', peopleAffected: '21-50', locationType: 'Public Road',
      status: 'Pending', assignedTo: null, upvoteCount: 18, resolvedAt: null, createdAt: daysAgo(2)
    },
    {
      reportId: '#SW-1012', userId: 3, category: 'Overflowing Bin', description: 'Community bin full since weekend.', 
      imageUrl: '/uploads/demo/bin3.svg', afterImageUrl: null, 
      latitude: 28.6130, longitude: 77.2140, locationText: 'Kasturba Gandhi Marg',
      priorityScore: 38, priorityLevel: 'Low', peopleAffected: '6-20', locationType: 'Residential',
      status: 'Pending', assignedTo: null, upvoteCount: 4, resolvedAt: null, createdAt: daysAgo(0)
    }
  ];

  for (const rep of reportsData) {
    insertReport.run(
      rep.reportId, rep.userId, rep.category, rep.description, rep.imageUrl, rep.afterImageUrl,
      rep.latitude, rep.longitude, rep.locationText, rep.priorityScore, rep.priorityLevel,
      rep.peopleAffected, rep.locationType, rep.status, rep.assignedTo, rep.upvoteCount,
      rep.resolvedAt, rep.createdAt
    );
  }

  // 3. Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (userId, message, type, reportId, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertNotification.run(1, 'Your report #SW-1001 has been received.', 'info', '#SW-1001', daysAgo(2));
  insertNotification.run(1, 'Report #SW-1006 has been submitted successfully.', 'success', '#SW-1006', daysAgo(0));
  insertNotification.run(1, 'Your issue #SW-1011 is gaining attention! (10+ upvotes)', 'info', '#SW-1011', daysAgo(1));

  // 4. Upvotes
  const insertUpvote = db.prepare(`
    INSERT INTO upvotes (reportId, userId, createdAt)
    VALUES (?, ?, ?)
  `);

  // Demo user upvoted a few reports
  insertUpvote.run(1, 2, daysAgo(1));
  insertUpvote.run(1, 3, daysAgo(1));
  insertUpvote.run(2, 1, daysAgo(4));
  insertUpvote.run(3, 1, daysAgo(2));

  console.log('Database seeding complete.');
}

export { getDb };
