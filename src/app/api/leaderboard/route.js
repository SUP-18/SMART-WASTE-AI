import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const topUsers = db.prepare(`
      SELECT id, name, ecoPoints, badges,
             (SELECT COUNT(*) FROM reports WHERE reports.userId = users.id) as reportCount,
             (SELECT COUNT(*) FROM reports WHERE reports.userId = users.id AND reports.status = 'Resolved') as resolvedCount,
             (SELECT COUNT(*) FROM upvotes WHERE upvotes.userId = users.id) as upvotesGiven
      FROM users
      WHERE LOWER(role) = 'citizen'
      ORDER BY ecoPoints DESC
      LIMIT 10
    `).all();

    const totalCitizensRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE LOWER(role) = 'citizen'").get();
    const totalResolvedRow = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'Resolved'").get();
    const totalPointsRow = db.prepare("SELECT SUM(ecoPoints) as total FROM users WHERE LOWER(role) = 'citizen'").get();

    const stats = {
      totalCitizens: totalCitizensRow?.count || 0,
      totalResolved: totalResolvedRow?.count || 0,
      totalPoints: totalPointsRow?.total || 0,
    };

    return NextResponse.json({ leaders: topUsers, stats });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
