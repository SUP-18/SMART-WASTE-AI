import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request, { params }) {
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

    const formData = await request.formData();
    const file = formData.get('afterImage');
    const statusOverride = formData.get('status') || 'Resolved';
    let afterImageUrl = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      
      let ext = 'jpg';
      if (file.type) {
        ext = file.type.split('/').pop() || 'jpg';
      } else if (file.name && file.name.includes('.')) {
        ext = file.name.split('.').pop();
      }
      
      const filename = `after-${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      afterImageUrl = `/uploads/${filename}`;
    }

    const now = new Date().toISOString();
    
    db.prepare('BEGIN').run();
    
    db.prepare(`UPDATE reports SET status = ?, afterImageUrl = ?, resolvedAt = ?, updatedAt = ? WHERE id = ?`).run(
      statusOverride, afterImageUrl, now, now, report.id
    );

    if (report.status !== 'Resolved') {
        db.prepare('UPDATE users SET ecoPoints = ecoPoints + 10 WHERE id = ?').run(report.userId);
        db.prepare(`INSERT INTO notifications (userId, message, type, read, createdAt) VALUES (?, ?, ?, 0, ?)`).run(
            report.userId, `Your report ${report.reportId} has been resolved!`, 'status_update', now
        );
    }

    db.prepare('COMMIT').run();

    const updatedReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(report.id);
    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    getDb().prepare('ROLLBACK').run();
    console.error('Resolve report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
