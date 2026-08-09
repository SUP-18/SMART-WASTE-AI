import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculatePriority } from '@/lib/priority';
import { findDuplicates } from '@/lib/duplicates';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const priority = searchParams.get('priority');
    const sort = searchParams.get('sort') || 'newest';
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    const db = getDb();
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

    return NextResponse.json({ reports, total });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { 
      category, description, latitude, longitude, locationText, 
      peopleAffected, locationType, aiConfidence, imageUrl 
    } = data;

    const db = getDb();
    const maxIdRes = db.prepare('SELECT MAX(id) as maxId FROM reports').get();
    const nextId = (maxIdRes.maxId || 0) + 1;
    const reportId = `#SW-${nextId + 1000}`;

    const reportData = {
      reportId, 
      category: category || '', 
      description: description || '', 
      latitude: parseFloat(latitude) || 0, 
      longitude: parseFloat(longitude) || 0, 
      locationText: locationText || '',
      peopleAffected: peopleAffected || '1-5', 
      locationType: locationType || 'Public', 
      aiConfidence: parseFloat(aiConfidence) || 0,
      userId: session.userId, status: 'Pending', upvoteCount: 0,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80', 
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };

    const priorityResult = calculatePriority(reportData);
    reportData.priorityScore = priorityResult.score;
    reportData.priorityLevel = priorityResult.level;

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
    const result = stmt.run(reportData);
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);

    const duplicates = findDuplicates(report, db.prepare("SELECT * FROM reports WHERE status != 'Resolved'").all());

    const now = new Date().toISOString();
    db.prepare(`INSERT INTO notifications (userId, message, type, read, createdAt) VALUES (?, ?, ?, 0, ?)`).run(
      session.userId, `Your report ${reportId} has been successfully submitted.`, 'report_created', now
    );

    // Notify all admin users that a new issue was reported
    const admins = db.prepare("SELECT id FROM users WHERE LOWER(role) = 'admin'").all();
    for (const admin of admins) {
      db.prepare(`INSERT INTO notifications (userId, message, type, read, createdAt) VALUES (?, ?, ?, 0, ?)`).run(
        admin.id, `New report ${reportId} (${category || 'Issue'}) reported at ${locationText || 'location'}.`, 'new_report', now
      );
    }

    return NextResponse.json({ report, duplicates });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
