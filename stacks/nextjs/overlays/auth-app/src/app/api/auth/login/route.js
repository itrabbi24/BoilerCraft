import { NextResponse } from 'next/server';
import { findUserByCredentials, signToken, publicUser } from '@/lib/auth';

export async function POST(request) {
  const { email, password } = await request.json();
  const user = await findUserByCredentials(email, password);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }
  return NextResponse.json({ success: true, token: signToken(user), user: publicUser(user) });
}
