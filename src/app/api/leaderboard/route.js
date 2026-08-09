import { NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/db';

export async function GET() {
  try {
    const { leaders, stats } = await getLeaderboardData();
    return NextResponse.json({ leaders, stats });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
