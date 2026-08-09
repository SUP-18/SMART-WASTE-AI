import { NextResponse } from 'next/server';
import { getReportById, updateReport, createNotification, updateUserEcoPoints, deleteReport } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : id;
    
    const report = await getReportById(lookupId);
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

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : id;
    
    const report = await getReportById(lookupId);
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updates = await request.json();
    const updateFields = {};
    let statusChanged = false;

    if (updates.status && updates.status !== report.status) {
      updateFields.status = updates.status;
      statusChanged = true;
      if (updates.status === 'Resolved') {
        updateFields.resolvedAt = new Date().toISOString();
      }
    }
    if (updates.assignedTo) {
      updateFields.assignedTo = updates.assignedTo;
    }

    const updatedReport = await updateReport(report.id, updateFields);

    if (statusChanged) {
      await createNotification({
        userId: report.userId,
        message: `Your report ${report.reportId || '#' + report.id} status changed to ${updates.status}`,
        type: 'status_update',
        reportId: report.reportId
      });
      if (updates.status === 'Resolved' && report.status !== 'Resolved') {
        await updateUserEcoPoints(report.userId, 10);
      }
    } else if (updates.assignedTo && updates.assignedTo !== report.assignedTo) {
      await createNotification({
        userId: report.userId,
        message: `Your report ${report.reportId || '#' + report.id} has been assigned to ${updates.assignedTo}`,
        type: 'status_update',
        reportId: report.reportId
      });
    }

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : id;

    const report = await getReportById(lookupId);
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await deleteReport(report.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
