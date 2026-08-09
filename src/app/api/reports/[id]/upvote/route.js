import { NextResponse } from 'next/server';
import { getReportById, hasUserUpvoted, addUpvote, updateReport, updateUserEcoPoints, createNotification } from '@/lib/db';
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

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : id;

    const report = await getReportById(lookupId);
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const alreadyUpvoted = await hasUserUpvoted(report.id, userId);
    if (alreadyUpvoted) return NextResponse.json({ error: 'Already upvoted' }, { status: 400 });

    const newCount = await addUpvote(report.id, userId);
    report.upvoteCount = newCount;
    const newPriorityResult = calculatePriority(report);
    const newPriority = newPriorityResult.score;

    await updateReport(report.id, { upvoteCount: newCount, priorityScore: newPriority });
    await updateUserEcoPoints(userId, 5);

    if ([5, 10, 25].includes(newCount)) {
      await createNotification({
        userId: report.userId,
        message: `Your report ${report.reportId} reached ${newCount} upvotes!`,
        type: 'milestone',
        reportId: report.reportId
      });
    }

    return NextResponse.json({ upvoted: true, newCount, newPriority });
  } catch (error) {
    console.error('Upvote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
