import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (email === 'admin@example.com' && password === 'admin123') {
      return NextResponse.json({
        success: true,
        user: { id: 1, name: 'Admin User', email, role: 'admin' },
        token: 'mock_jwt_token_admin'
      });
    }

    if (email && password) {
      return NextResponse.json({
        success: true,
        user: { id: 2, name: 'Regular User', email, role: 'user' },
        token: 'mock_jwt_token_user'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
