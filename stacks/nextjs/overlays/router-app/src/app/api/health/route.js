import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    stack: 'Next.js {{VERSION}} App Router',
    database: '{{DB_TYPE}}',
    appName: {{APP_TITLE_JS}}
  });
}
