import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const qUserId = searchParams.get('userId');
    const userId = qUserId ? parseInt(qUserId) : session.userId;
    
    if (session.userId !== userId && session.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    const notifications = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC').all(userId);
    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0').get(userId).count;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();

    if (body.markAllRead) {
        const userId = body.userId || session.userId;
        db.prepare('UPDATE notifications SET read = 1 WHERE userId = ?').run(userId);
        return NextResponse.json({ success: true });
    } else if (body.notificationIds && Array.isArray(body.notificationIds)) {
        const ids = body.notificationIds.map(id => Number(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            db.prepare(`UPDATE notifications SET read = 1 WHERE id IN (${placeholders})`).run(...ids);
        }
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
