import { supabase } from './supabase';
import path from 'path';

// Helper to check if Supabase is properly configured via environment variables
export function isSupabaseConfigured() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key'
  );
}

let sqliteDb = null;
function getSqliteDb() {
  if (sqliteDb) return sqliteDb;
  const Database = require('better-sqlite3');
  sqliteDb = new Database(path.join(process.cwd(), 'smartwaste.db'));
  return sqliteDb;
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
export async function getUserByEmail(email) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') console.error('Supabase getUserByEmail error:', error);
    if (!data) return null;
    return {
      ...data,
      ecoPoints: data.ecopoints ?? data.ecoPoints ?? 0
    };
  } else {
    const db = getSqliteDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
  }
}

export async function getUserById(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) console.error('Supabase getUserById error:', error);
    if (!data) return null;
    return {
      ...data,
      ecoPoints: data.ecopoints ?? data.ecoPoints ?? 0
    };
  } else {
    const db = getSqliteDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  }
}

export async function createUser({ name, email, password, role = 'citizen', ecoPoints = 0 }) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password, role, ecopoints: ecoPoints }])
      .select()
      .single();
    if (error) {
      console.error('Supabase createUser error:', error);
      throw error;
    }
    return {
      ...data,
      ecoPoints: data.ecopoints ?? data.ecoPoints ?? 0
    };
  } else {
    const db = getSqliteDb();
    const result = db.prepare('INSERT INTO users (name, email, password, role, ecoPoints) VALUES (?, ?, ?, ?, ?)').run(name, email, password, role, ecoPoints);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }
}

export async function updateUserEcoPoints(userId, pointsToAdd) {
  if (isSupabaseConfigured()) {
    const user = await getUserById(userId);
    if (!user) return;
    const newPoints = (user.ecoPoints || user.ecopoints || 0) + pointsToAdd;
    await supabase.from('users').update({ ecopoints: newPoints }).eq('id', userId);
  } else {
    const db = getSqliteDb();
    db.prepare('UPDATE users SET ecoPoints = ecoPoints + ? WHERE id = ?').run(pointsToAdd, userId);
  }
}

export async function getAdminUsers() {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('users').select('id, name, email').ilike('role', 'admin');
    return data || [];
  } else {
    const db = getSqliteDb();
    return db.prepare("SELECT id, name, email FROM users WHERE LOWER(role) = 'admin'").all();
  }
}

// -------------------------------------------------------------
// REPORT OPERATIONS
// -------------------------------------------------------------
export async function getReports({ status, category, userId, priority, search, sort = 'newest', limit = 50, offset = 0 } = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase.from('reports').select('*, users(name)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (userId) query = query.eq('userid', userId);
    if (priority) query = query.eq('prioritylevel', priority);
    if (search) query = query.or(`description.ilike.%${search}%,locationtext.ilike.%${search}%,reportid.ilike.%${search}%`);

    if (sort === 'oldest') query = query.order('id', { ascending: true });
    else if (sort === 'priority') query = query.order('priorityscore', { ascending: false });
    else query = query.order('id', { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) console.error('Supabase getReports error:', error);
    
    const formattedReports = (data || []).map(r => ({
      ...r,
      reportId: r.reportId || r.reportid,
      userId: r.userId || r.userid,
      imageUrl: r.imageUrl || r.imageurl,
      afterImageUrl: r.afterImageUrl || r.afterimageurl,
      locationText: r.locationText || r.locationtext,
      priorityScore: r.priorityScore || r.priorityscore,
      priorityLevel: r.priorityLevel || r.prioritylevel,
      peopleAffected: r.peopleAffected || r.peopleaffected,
      locationType: r.locationType || r.locationtype,
      upvoteCount: r.upvoteCount || r.upvotecount || 0,
      aiConfidence: r.aiConfidence || r.aiconfidence,
      resolvedAt: r.resolvedAt || r.resolvedat,
      createdAt: r.createdAt || r.createdat,
      updatedAt: r.updatedAt || r.updatedat,
      reporterName: r.users?.name || 'Citizen'
    }));

    return { reports: formattedReports, total: count || 0 };
  } else {
    const db = getSqliteDb();
    let query = 'SELECT reports.*, users.name as reporterName FROM reports LEFT JOIN users ON reports.userId = users.id WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM reports WHERE 1=1';
    const params = [];

    if (status) { query += ' AND status = ?'; countQuery += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; countQuery += ' AND category = ?'; params.push(category); }
    if (userId) { query += ' AND userId = ?'; countQuery += ' AND userId = ?'; params.push(userId); }
    if (priority) { query += ' AND priorityLevel = ?'; countQuery += ' AND priorityLevel = ?'; params.push(priority); }
    if (search) {
      query += ' AND (description LIKE ? OR locationText LIKE ? OR reportId LIKE ?)';
      countQuery += ' AND (description LIKE ? OR locationText LIKE ? OR reportId LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (sort === 'oldest') query += ' ORDER BY reports.createdAt ASC';
    else if (sort === 'priority') query += ' ORDER BY reports.priorityScore DESC';
    else query += ' ORDER BY reports.createdAt DESC';

    query += ' LIMIT ? OFFSET ?';
    const reports = db.prepare(query).all(...params, limit, offset);
    const total = db.prepare(countQuery).get(...params).total;
    return { reports, total };
  }
}

export async function getReportById(idOrReportId) {
  if (isSupabaseConfigured()) {
    let query = supabase.from('reports').select('*, users(name)');
    if (String(idOrReportId).startsWith('#')) {
      query = query.eq('reportid', idOrReportId);
    } else {
      query = query.eq('id', idOrReportId);
    }
    const { data, error } = await query.single();
    if (error) console.error('Supabase getReportById error:', error);
    if (!data) return null;
    return {
      ...data,
      reportId: data.reportId || data.reportid,
      userId: data.userId || data.userid,
      imageUrl: data.imageUrl || data.imageurl,
      afterImageUrl: data.afterImageUrl || data.afterimageurl,
      locationText: data.locationText || data.locationtext,
      priorityScore: data.priorityScore || data.priorityscore,
      priorityLevel: data.priorityLevel || data.prioritylevel,
      peopleAffected: data.peopleAffected || data.peopleaffected,
      locationType: data.locationType || data.locationtype,
      upvoteCount: data.upvoteCount || data.upvotecount || 0,
      aiConfidence: data.aiConfidence || data.aiconfidence,
      resolvedAt: data.resolvedAt || data.resolvedat,
      createdAt: data.createdAt || data.createdat,
      updatedAt: data.updatedAt || data.updatedat,
      reporterName: data.users?.name || 'Citizen'
    };
  } else {
    const db = getSqliteDb();
    if (String(idOrReportId).startsWith('#')) {
      return db.prepare('SELECT reports.*, users.name as reporterName FROM reports LEFT JOIN users ON reports.userId = users.id WHERE reportId = ?').get(idOrReportId) || null;
    }
    return db.prepare('SELECT reports.*, users.name as reporterName FROM reports LEFT JOIN users ON reports.userId = users.id WHERE reports.id = ?').get(idOrReportId) || null;
  }
}

export async function createReport(reportData) {
  if (isSupabaseConfigured()) {
    // Generate next report ID
    const { data: latest } = await supabase.from('reports').select('id').order('id', { ascending: false }).limit(1);
    const nextNum = ((latest && latest[0] ? latest[0].id : 0) + 1001);
    const reportId = `#SW-${nextNum}`;

    const row = {
      reportid: reportId,
      category: reportData.category || '',
      description: reportData.description || '',
      latitude: reportData.latitude || 0,
      longitude: reportData.longitude || 0,
      locationtext: reportData.locationText || reportData.locationtext || '',
      peopleaffected: reportData.peopleAffected || reportData.peopleaffected || '1-5',
      locationtype: reportData.locationType || reportData.locationtype || 'Public Road',
      aiconfidence: reportData.aiConfidence ?? reportData.aiconfidence ?? 0.85,
      userid: reportData.userId || reportData.userid,
      status: reportData.status || 'Pending',
      upvotecount: reportData.upvoteCount || reportData.upvotecount || 0,
      imageurl: reportData.imageUrl || reportData.imageurl || '',
      priorityscore: reportData.priorityScore || reportData.priorityscore || 50,
      prioritylevel: reportData.priorityLevel || reportData.prioritylevel || 'Medium',
      createdat: reportData.createdAt || reportData.createdat || new Date().toISOString(),
      updatedat: reportData.updatedAt || reportData.updatedat || new Date().toISOString()
    };

    const { data, error } = await supabase.from('reports').insert([row]).select().single();
    if (error) {
      console.error('Supabase createReport insert error:', error);
      throw error;
    }
    
    return {
      ...data,
      id: data.id,
      reportId: data.reportid || data.reportId || reportId,
      userId: data.userid || data.userId,
      imageUrl: data.imageurl || data.imageUrl,
      afterImageUrl: data.afterimageurl || data.afterImageUrl,
      locationText: data.locationtext || data.locationText,
      priorityScore: data.priorityscore || data.priorityScore,
      priorityLevel: data.prioritylevel || data.priorityLevel,
      peopleAffected: data.peopleaffected || data.peopleAffected,
      locationType: data.locationtype || data.locationType,
      upvoteCount: data.upvotecount || data.upvoteCount || 0,
      aiConfidence: data.aiconfidence || data.aiConfidence
    };
  } else {
    const db = getSqliteDb();
    const maxIdRes = db.prepare('SELECT MAX(id) as maxId FROM reports').get();
    const nextId = (maxIdRes.maxId || 0) + 1;
    const reportId = `#SW-${nextId + 1000}`;
    
    const finalData = { ...reportData, reportId };
    
    const stmt = db.prepare(`
      INSERT INTO reports (
        reportId, category, description, latitude, longitude, locationText,
        peopleAffected, locationType, aiConfidence, userId, status, upvoteCount,
        imageUrl, priorityScore, priorityLevel, createdAt, updatedAt
      ) VALUES (
        @reportId, @category, @description, @latitude, @longitude, @locationText,
        @peopleAffected, @locationType, @aiConfidence, @userId, @status, @upvoteCount,
        @imageUrl, @priorityScore, @priorityLevel, @createdAt, @updatedAt
      )
    `);
    const result = stmt.run(finalData);
    return db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  }
}

export async function updateReport(id, updateFields) {
  if (isSupabaseConfigured()) {
    const dbFields = {};
    for (const [key, value] of Object.entries(updateFields)) {
      dbFields[key.toLowerCase()] = value;
    }
    dbFields['updatedat'] = new Date().toISOString();

    const { data, error } = await supabase
      .from('reports')
      .update(dbFields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = getSqliteDb();
    const keys = Object.keys(updateFields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updateFields[k]);
    db.prepare(`UPDATE reports SET ${setClause}, updatedAt = ? WHERE id = ?`).run(...values, new Date().toISOString(), id);
    return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  }
}

// -------------------------------------------------------------
// NOTIFICATION OPERATIONS
// -------------------------------------------------------------
export async function getNotifications(userId) {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('userid', userId)
      .order('createdat', { ascending: false });
    return data || [];
  } else {
    const db = getSqliteDb();
    return db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC').all(userId);
  }
}

export async function createNotification({ userId, message, type = 'info', reportId = null }) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('notifications').insert([{
      userid: userId,
      message,
      type,
      reportid: reportId,
      read: 0,
      createdat: new Date().toISOString()
    }]);
    if (error) console.error('Supabase createNotification error:', error);
  } else {
    const db = getSqliteDb();
    db.prepare('INSERT INTO notifications (userId, message, type, reportId, read, createdAt) VALUES (?, ?, ?, ?, 0, ?)').run(
      userId, message, type, reportId, new Date().toISOString()
    );
  }
}

export async function markNotificationsAsRead(userId) {
  if (isSupabaseConfigured()) {
    await supabase.from('notifications').update({ read: 1 }).eq('userid', userId);
  } else {
    const db = getSqliteDb();
    db.prepare('UPDATE notifications SET read = 1 WHERE userId = ?').run(userId);
  }
}

// -------------------------------------------------------------
// UPVOTE OPERATIONS
// -------------------------------------------------------------
export async function hasUserUpvoted(reportId, userId) {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('upvotes').select('id').eq('reportid', reportId).eq('userid', userId).single();
    return !!data;
  } else {
    const db = getSqliteDb();
    const row = db.prepare('SELECT id FROM upvotes WHERE reportId = ? AND userId = ?').get(reportId, userId);
    return !!row;
  }
}

export async function addUpvote(reportId, userId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('upvotes').insert([{ reportid: reportId, userid: userId }]);
    if (error) console.error('Supabase addUpvote error:', error);
    const report = await getReportById(reportId);
    const newCount = (report?.upvoteCount || 0) + 1;
    await supabase.from('reports').update({ upvotecount: newCount }).eq('id', reportId);
    return newCount;
  } else {
    const db = getSqliteDb();
    db.prepare('INSERT INTO upvotes (reportId, userId, createdAt) VALUES (?, ?, ?)').run(reportId, userId, new Date().toISOString());
    db.prepare('UPDATE reports SET upvoteCount = upvoteCount + 1 WHERE id = ?').run(reportId);
    const updated = db.prepare('SELECT upvoteCount FROM reports WHERE id = ?').get(reportId);
    return updated?.upvoteCount || 0;
  }
}

// -------------------------------------------------------------
// LEADERBOARD & ANALYTICS
// -------------------------------------------------------------
export async function getLeaderboardData() {
  if (isSupabaseConfigured()) {
    const { data: leaders } = await supabase.from('users').select('id, name, ecopoints, badges').ilike('role', 'citizen').order('ecopoints', { ascending: false }).limit(10);
    const { count: totalCitizens } = await supabase.from('users').select('*', { count: 'exact', head: true }).ilike('role', 'citizen');
    const { count: totalResolved } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'Resolved');

    const formattedLeaders = await Promise.all((leaders || []).map(async (u) => {
      const { count: rCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('userid', u.id);
      const { count: resCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('userid', u.id).eq('status', 'Resolved');
      return {
        ...u,
        ecoPoints: u.ecopoints ?? u.ecoPoints ?? 0,
        reportCount: rCount || 0,
        resolvedCount: resCount || 0
      };
    }));

    return {
      leaders: formattedLeaders,
      stats: {
        totalCitizens: totalCitizens || 0,
        totalResolved: totalResolved || 0,
        totalPoints: (leaders || []).reduce((acc, curr) => acc + (curr.ecopoints || curr.ecoPoints || 0), 0)
      }
    };
  } else {
    const db = getSqliteDb();
    const topUsers = db.prepare(`
      SELECT id, name, ecoPoints, badges,
             (SELECT COUNT(*) FROM reports WHERE reports.userId = users.id) as reportCount,
             (SELECT COUNT(*) FROM reports WHERE reports.userId = users.id AND reports.status = 'Resolved') as resolvedCount
      FROM users
      WHERE role = 'citizen'
      ORDER BY ecoPoints DESC
      LIMIT 10
    `).all();

    return {
      leaders: topUsers,
      stats: { totalCitizens, totalResolved, totalPoints }
    };
  }
}

export async function clearDatabase(mode = 'reports') {
  if (isSupabaseConfigured()) {
    await supabase.from('upvotes').delete().neq('id', 0);
    await supabase.from('notifications').delete().neq('id', 0);
    await supabase.from('reports').delete().neq('id', 0);
    if (mode === 'all') {
      await supabase.from('users').delete().neq('role', 'admin');
    }
  } else {
    const db = getSqliteDb();
    db.prepare('BEGIN').run();
    db.prepare('DELETE FROM upvotes').run();
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM reports').run();
    if (mode === 'all') {
      db.prepare("DELETE FROM users WHERE role != 'admin'").run();
    }
    db.prepare('COMMIT').run();
  }
}

