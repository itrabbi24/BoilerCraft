import { NextResponse } from 'next/server';
import { createUser, signToken, publicUser } from '@/lib/auth';

export async function POST(request) {
  const { name, email, password } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ success: false, error: 'Name, email and password are required.' }, { status: 400 });
  }
  const user = await createUser({ name, email, password });
  if (!user) {
    return NextResponse.json({ success: false, error: 'User already exists.' }, { status: 409 });
  }
  return NextResponse.json({ success: true, token: signToken(user), user: publicUser(user) }, { status: 201 });
}
