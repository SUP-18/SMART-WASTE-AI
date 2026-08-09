import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const info = db.prepare(`
      INSERT INTO users (name, email, password, role, ecoPoints, badges, createdAt)
      VALUES (?, ?, ?, 'citizen', 0, '[]', datetime('now'))
    `).run(name, email, password);

    const newUser = db.prepare('SELECT id, name, email, role, ecoPoints, badges FROM users WHERE id = ?').get(info.lastInsertRowid);

    // Set session cookie using the shared helper
    const session = createSession(newUser.id, newUser.role);
    (await cookies()).set(SESSION_COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      message: 'Registration successful',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
