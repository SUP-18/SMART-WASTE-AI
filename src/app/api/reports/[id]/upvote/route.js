import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { calculatePriority } from '@/lib/priority';

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId } = await request.json();
    if (session.userId !== userId && session.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const isNumeric = /^\d+$/.test(id);
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : (id.startsWith('#') ? id : `#${id}`);
    const report = db.prepare(`SELECT * FROM reports WHERE ${isNumeric ? 'id' : 'reportId'} = ?`).get(isNumeric ? id : lookupId);
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const existing = db.prepare('SELECT * FROM upvotes WHERE reportId = ? AND userId = ?').get(report.id, userId);
    if (existing) return NextResponse.json({ error: 'Already upvoted' }, { status: 400 });

    db.prepare('BEGIN').run();
    db.prepare('INSERT INTO upvotes (reportId, userId, createdAt) VALUES (?, ?, ?)').run(report.id, userId, new Date().toISOString());
    
    const newCount = report.upvoteCount + 1;
    report.upvoteCount = newCount;
    const newPriorityResult = calculatePriority(report);
    const newPriority = newPriorityResult.score;
    
    db.prepare('UPDATE reports SET upvoteCount = ?, priorityScore = ? WHERE id = ?').run(newCount, newPriority, report.id);
    db.prepare('UPDATE users SET ecoPoints = ecoPoints + 5 WHERE id = ?').run(userId);
    
    if ([5, 10, 25].includes(newCount)) {
        db.prepare(`INSERT INTO notifications (userId, message, type, read, createdAt) VALUES (?, ?, ?, 0, ?)`).run(
            report.userId, `Your report ${report.reportId} reached ${newCount} upvotes!`, 'milestone', new Date().toISOString()
        );
    }
    db.prepare('COMMIT').run();

    return NextResponse.json({ upvoted: true, newCount, newPriority });
  } catch (error) {
    getDb().prepare('ROLLBACK').run();
    console.error('Upvote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userId = session.userId;
    const db = getDb();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const isNumeric = /^\d+$/.test(id);
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : (id.startsWith('#') ? id : `#${id}`);
    const report = db.prepare(`SELECT * FROM reports WHERE ${isNumeric ? 'id' : 'reportId'} = ?`).get(isNumeric ? id : lookupId);
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const existing = db.prepare('SELECT * FROM upvotes WHERE reportId = ? AND userId = ?').get(report.id, userId);
    if (!existing) return NextResponse.json({ error: 'Not upvoted' }, { status: 400 });

    db.prepare('BEGIN').run();
    db.prepare('DELETE FROM upvotes WHERE reportId = ? AND userId = ?').run(report.id, userId);
    
    const newCount = Math.max(0, report.upvoteCount - 1);
    report.upvoteCount = newCount;
    const newPriorityResult = calculatePriority(report);
    const newPriority = newPriorityResult.score;
    
    db.prepare('UPDATE reports SET upvoteCount = ?, priorityScore = ? WHERE id = ?').run(newCount, newPriority, report.id);
    db.prepare('COMMIT').run();

    return NextResponse.json({ upvoted: false, newCount, newPriority });
  } catch (error) {
    getDb().prepare('ROLLBACK').run();
    console.error('Remove upvote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
