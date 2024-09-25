import { NextResponse } from 'next/server';
import { getMssqlPool } from '@/lib/mssql';

export async function GET() {
  try {
    const pool = await getMssqlPool();
    const result = await pool.request().query('SELECT @@VERSION as version, GETDATE() as currentTime');
    
    return NextResponse.json({
      status: 'online',
      stack: 'Next.js App Router',
      database: 'Microsoft SQL Server (MSSQL)',
      appName: '{{APP_TITLE}}',
      author: '{{AUTHOR}}',
      dbInfo: result.recordset[0]
    });
  } catch (error) {
    return NextResponse.json({
      status: 'database_unreachable_or_offline',
      stack: 'Next.js App Router + MSSQL',
      message: error.message
    }, { status: 500 });
  }
}
