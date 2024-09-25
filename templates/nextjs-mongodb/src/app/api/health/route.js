import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({
      status: 'online',
      stack: 'Next.js App Router',
      database: 'MongoDB (Mongoose)',
      appName: '{{APP_TITLE}}',
      author: '{{AUTHOR}}'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
