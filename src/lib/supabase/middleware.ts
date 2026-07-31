import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database';
import type { UserRole } from '@/lib/types/database';

// Role → default redirect path
const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  doctor: '/clinical/patients',
  nurse: '/clinical/patients',
  receptionist: '/reception',
  patient: '/portal',
};

// Protected route prefixes and their required roles
const ROUTE_ROLES: [string, UserRole[]][] = [
  ['/admin', ['admin']],
  ['/clinical', ['admin', 'doctor', 'nurse']],
  ['/reception', ['admin', 'receptionist']],
  ['/portal', ['patient']],
  ['/assistant', ['admin', 'doctor', 'nurse', 'receptionist', 'patient']],
  ['/schedule', ['admin', 'doctor', 'nurse', 'receptionist']],
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  ) as any;

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Public paths that do not require authentication
  const isPublicPath =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/about') ||
    path.startsWith('/contact');

  // Redirect unauthenticated users to login, keeping track of where they wanted to go
  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && (path.startsWith('/login') || path.startsWith('/signup'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile as any)?.role as UserRole ?? 'patient';
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  // Enforce route-based role access
  if (user) {
    for (const [prefix, allowedRoles] of ROUTE_ROLES) {
      if (path.startsWith(prefix)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        const role = (profile as any)?.role as UserRole ?? 'patient';
        if (!allowedRoles.includes(role)) {
          // Redirect to their appropriate home
          return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
        }
        break;
      }
    }
  }

  return supabaseResponse;
}
