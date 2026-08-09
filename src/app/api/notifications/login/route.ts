/**
 * POST /api/notifications/login
 *
 * Called client-side immediately after a successful Supabase sign-in.
 * Sends a login welcome email to the authenticated user.
 *
 * Protected: only fires for a valid Supabase session.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/notifications';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Verify the caller has a valid session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse optional body data (loginTime, ip)
    let body: { loginTime?: string; ipAddress?: string } = {};
    try {
      body = await request.json();
    } catch {
      // body is optional
    }

    // 3. Fetch profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle();

    const firstName = (profile as any)?.first_name
      || user.user_metadata?.first_name
      || 'User';
    const lastName = (profile as any)?.last_name
      || user.user_metadata?.last_name
      || '';

    // 4. Get real IP from forwarded headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = body.ipAddress || (forwarded ? forwarded.split(',')[0].trim() : undefined);

    // 5. Fire login welcome email (non-blocking)
    notificationService.sendLoginWelcome(
      user.email,
      firstName,
      lastName,
      body.loginTime || new Date().toISOString(),
      ip,
    ).catch(() => void 0); // swallow async error

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[/api/notifications/login]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
