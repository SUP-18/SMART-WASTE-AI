import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    // Only allow admin to clear data
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    
    // Check if we should only clear reports or everything (except admin)
    const { mode } = await request.json().catch(() => ({ mode: 'reports' }));
    
    db.prepare('BEGIN').run();
    
    // Always clear dependent tables first
    db.prepare('DELETE FROM upvotes').run();
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM reports').run();
    
    if (mode === 'all') {
      // Clear all citizens, keep admin
      db.prepare("DELETE FROM users WHERE role != 'admin'").run();
    }
    
    db.prepare('COMMIT').run();

    return NextResponse.json({ success: true, message: 'Database cleared successfully' });
  } catch (error) {
    getDb().prepare('ROLLBACK').run();
    console.error('Clear database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
