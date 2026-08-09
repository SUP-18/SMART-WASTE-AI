import { NextResponse } from 'next/server';
import { getReportById, updateReport, createNotification, updateUserEcoPoints } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const lookupId = id.startsWith('%23') ? decodeURIComponent(id) : id;

    const report = await getReportById(lookupId);
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get('afterImage');
    const statusOverride = formData.get('status') || 'Resolved';
    let afterImageUrl = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      let ext = 'jpg';
      if (file.type) {
        ext = file.type.split('/').pop() || 'jpg';
      } else if (file.name && file.name.includes('.')) {
        ext = file.name.split('.').pop();
      }
      
      const filename = `after-${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`;

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { error: uploadErr } = await supabase.storage
          .from('reports')
          .upload(filename, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true
          });
        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage.from('reports').getPublicUrl(filename);
          afterImageUrl = publicUrlData.publicUrl;
        }
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        afterImageUrl = `/uploads/${filename}`;
      }
    }

    const now = new Date().toISOString();
    const updateFields = {
      status: statusOverride,
      resolvedAt: now,
    };
    if (afterImageUrl) {
      updateFields.afterImageUrl = afterImageUrl;
    }

    const updatedReport = await updateReport(report.id, updateFields);

    if (report.status !== 'Resolved') {
      await updateUserEcoPoints(report.userId, 10);
      await createNotification({
        userId: report.userId,
        message: `Your report ${report.reportId} has been resolved!`,
        type: 'status_update',
        reportId: report.reportId
      });
    }

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('Resolve report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
