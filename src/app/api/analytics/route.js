import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    const db = getDb();
    
    const countsRow = db.prepare(`
      SELECT 
        COUNT(*) as totalReports,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN priorityScore > 75 THEN 1 ELSE 0 END) as highPriority
      FROM reports
    `).get();

    const totalReports = countsRow.totalReports || 0;

    const categoriesRaw = db.prepare(`
      SELECT 
        category, 
        COUNT(*) as count,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolvedCount
      FROM reports 
      GROUP BY category 
      ORDER BY count DESC
    `).all();
    const reportsByCategory = categoriesRaw.map(c => ({
      ...c,
      percentage: totalReports > 0 ? ((c.count / totalReports) * 100).toFixed(1) : 0,
      resolutionRate: c.count > 0 ? ((c.resolvedCount / c.count) * 100).toFixed(1) : 0
    }));

    const reportsByStatus = db.prepare('SELECT status, COUNT(*) as count FROM reports GROUP BY status ORDER BY count DESC').all();

    const mostReportedIssue = reportsByCategory.length > 0 ? reportsByCategory[0] : null;

    const hotspots = db.prepare(`
      SELECT 
        locationText, 
        COUNT(*) as count, 
        MAX(category) as topCategory,
        AVG(priorityScore) as avgPriority,
        (SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as resolutionRate
      FROM reports 
      GROUP BY locationText 
      ORDER BY count DESC 
      LIMIT 5
    `).all();

    const mostAffectedArea = hotspots.length > 0 ? { location: hotspots[0].locationText, count: hotspots[0].count } : null;

    const hoursRaw = db.prepare(`
      SELECT strftime('%H', createdAt) as hour, COUNT(*) as count
      FROM reports
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1
    `).get();
    
    let peakReportingTime = 'Unknown';
    if (hoursRaw && hoursRaw.hour) {
      const hr = parseInt(hoursRaw.hour);
      peakReportingTime = `${hr}:00 - ${(hr+3)%24}:00`;
    }

    const avgResRow = db.prepare(`
      SELECT AVG(julianday(resolvedAt) - julianday(createdAt)) * 24 as avgResHours 
      FROM reports 
      WHERE resolvedAt IS NOT NULL
    `).get();
    const avgResolutionTime = avgResRow.avgResHours ? avgResRow.avgResHours.toFixed(1) : 0;

    const overTimeRaw = db.prepare(`
      SELECT date(createdAt) as date, COUNT(*) as count 
      FROM reports 
      WHERE createdAt >= date('now', '-30 days')
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `).all();
    const reportsOverTime = overTimeRaw;

    return NextResponse.json({
      totalReports: countsRow.totalReports || 0,
      pending: countsRow.pending || 0,
      inProgress: countsRow.inProgress || 0,
      resolved: countsRow.resolved || 0,
      highPriority: countsRow.highPriority || 0,
      reportsByCategory,
      reportsByStatus,
      reportsOverTime,
      mostReportedIssue,
      peakReportingTime,
      mostAffectedArea,
      avgResolutionTime,
      hotspots
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
