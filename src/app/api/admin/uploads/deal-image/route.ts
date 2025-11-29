import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, data } = body || {};
    if (!filename || !data) {
      return NextResponse.json({ error: 'Missing filename or data' }, { status: 400 });
    }

    // data may be a data URL (data:<mime>;base64,<data>) or raw base64
    const matches = String(data).match(/^data:(.+);base64,(.*)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(String(data), 'base64');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${uniqueName}`;
    return NextResponse.json({ success: true, url }, { status: 201 });
  } catch (err) {
    console.error('Upload error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
