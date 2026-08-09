import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const isNumeric = /^\d+$/.test(id);
    
    let report;
    if (isNumeric) {
      report = db.prepare('SELECT reports.*, users.name as reporterName, users.email as reporterEmail FROM reports LEFT JOIN users ON reports.userId = users.id WHERE reports.id = ?').get(id);
    } else {
      const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : (id.startsWith('#') ? id : `#${id}`);
      report = db.prepare('SELECT reports.*, users.name as reporterName, users.email as reporterEmail FROM reports LEFT JOIN users ON reports.userId = users.id WHERE reports.reportId = ?').get(lookupId);
    }

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const isNumeric = /^\d+$/.test(id);
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : (id.startsWith('#') ? id : `#${id}`);
    const report = db.prepare(`SELECT * FROM reports WHERE ${isNumeric ? 'id' : 'reportId'} = ?`).get(isNumeric ? id : lookupId);
    
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updates = await request.json();
    const now = new Date().toISOString();
    
    let updateQuery = 'UPDATE reports SET updatedAt = ?';
    const updateParams = [now];
    let statusChanged = false;
    
    if (updates.status && updates.status !== report.status) {
      updateQuery += ', status = ?';
      updateParams.push(updates.status);
      statusChanged = true;
      if (updates.status === 'Resolved') {
        updateQuery += ', resolvedAt = ?';
        updateParams.push(now);
      }
    }
    if (updates.assignedTo) {
      updateQuery += ', assignedTo = ?';
      updateParams.push(updates.assignedTo);
    }

    updateQuery += ` WHERE id = ?`;
    updateParams.push(report.id);
    
    db.prepare('BEGIN').run();
    db.prepare(updateQuery).run(...updateParams);

    if (statusChanged) {
      db.prepare(`INSERT INTO notifications (userId, message, type, read, createdAt) VALUES (?, ?, ?, 0, ?)`).run(
        report.userId, `Your report ${report.reportId || '#' + report.id} status changed to ${updates.status}`, 'status_update', now
      );
      if (updates.status === 'Resolved' && report.status !== 'Resolved') {
        db.prepare('UPDATE users SET ecoPoints = ecoPoints + 10 WHERE id = ?').run(report.userId);
      }
    } else if (updates.assignedTo && updates.assignedTo !== report.assignedTo) {
      db.prepare(`INSERT INTO notifications (userId, message, type, read, createdAt) VALUES (?, ?, ?, 0, ?)`).run(
        report.userId, `Your report ${report.reportId || '#' + report.id} has been assigned to ${updates.assignedTo}`, 'status_update', now
      );
    } else if (updates.flagged) {
      db.prepare(`INSERT INTO notifications (userId, message, type, read, createdAt) VALUES (?, ?, ?, 0, ?)`).run(
        report.userId, `Your report ${report.reportId || '#' + report.id} has been flagged for verification`, 'status_update', now
      );
    }
    db.prepare('COMMIT').run();

    const updatedReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(report.id);
    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    getDb().prepare('ROLLBACK').run();
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
