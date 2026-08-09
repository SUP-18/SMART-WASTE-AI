import { NextResponse } from 'next/server';
import { clearDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode } = await request.json().catch(() => ({ mode: 'reports' }));
    await clearDatabase(mode);

    return NextResponse.json({ success: true, message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Clear database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
