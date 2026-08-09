import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('image');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Get extension safely from file type
    let ext = 'jpg';
    if (file.type) {
      ext = file.type.split('/').pop() || 'jpg';
    } else if (file.name && file.name.includes('.')) {
      ext = file.name.split('.').pop();
    }
    
    const filename = `${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`;

    // If Supabase environment variables are provided, upload to Supabase Storage bucket
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(filename, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Supabase Storage error:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('reports')
        .getPublicUrl(filename);

      return NextResponse.json({ url: publicUrlData.publicUrl });
    } else {
      // Local fallback
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      return NextResponse.json({ url: `/uploads/${filename}` });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
