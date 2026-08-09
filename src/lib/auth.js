import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'smartwaste_session';

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  
  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    return sessionData;
  } catch (err) {
    console.error('Failed to parse session cookie:', err);
    return null;
  }
}

export function createSession(userId, role) {
  const sessionData = { userId, role };
  return Buffer.from(JSON.stringify(sessionData)).toString('base64');
}
