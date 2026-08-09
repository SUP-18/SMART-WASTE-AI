import { NextResponse } from 'next/server';
import { getReports, createReport, createNotification, getAdminUsers } from '@/lib/db';
import { calculatePriority } from '@/lib/priority';
import { findDuplicates } from '@/lib/duplicates';
import { getSession } from '@/lib/auth';

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

    const { reports, total } = await getReports({ status, category, userId, priority, search, sort, limit, offset });

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

    const reportData = {
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

    const report = await createReport(reportData);

    const { reports: activeReports } = await getReports({ limit: 100 });
    const duplicates = findDuplicates(report, activeReports.filter(r => r.status !== 'Resolved'));

    await createNotification({
      userId: session.userId,
      message: `Your report ${report.reportId} has been successfully submitted.`,
      type: 'report_created',
      reportId: report.reportId
    });

    // Notify all admin users that a new issue was reported
    const admins = await getAdminUsers();
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        message: `New report ${report.reportId} (${category || 'Issue'}) reported at ${locationText || 'location'}.`,
        type: 'new_report',
        reportId: report.reportId
      });
    }

    return NextResponse.json({ report, duplicates });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
