import { NextResponse } from 'next/server';

/**
 * Server-side auth helper.
 * - If `process.env.ADMIN_API_TOKEN` is set, incoming requests must include
 *   `Authorization: Token <ADMIN_API_TOKEN>` or cookie `authToken=<ADMIN_API_TOKEN>`.
 * - If not set, the helper allows the request for local/dev convenience.
 */
export function requireAdminAuth(reqHeaders: Headers, cookies?: { get: (name: string) => any }) {
  const envToken = process.env.ADMIN_API_TOKEN;
  if (!envToken) {
    // No env token configured — allow (dev). In production set ADMIN_API_TOKEN.
    return { ok: true };
  }

  const auth = reqHeaders.get('authorization') || '';
  if (auth === `Token ${envToken}`) return { ok: true };

  // check cookie if available
  try {
    const cookieToken = cookies?.get && cookies.get('authToken');
    if (cookieToken) {
      // NextRequest.cookie get may return an object; normalize
      const val = typeof cookieToken === 'string' ? cookieToken : cookieToken?.value || '';
      if (val === envToken) return { ok: true };
    }
  } catch (e) {
    // ignore
  }

  return { ok: false, status: 401, body: { error: 'Unauthorized' } };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
