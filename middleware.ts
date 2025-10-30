import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');
  const isOnboarding = req.nextUrl.pathname.includes('/onboarding');
  const isAppPage = req.nextUrl.pathname.startsWith('/app');
  
  // NON bloccare la pagina di onboarding
  if (isOnboarding) {
    return res;
  }
  
  // Se NON autenticato e cerca di accedere a pagine protette → login
  if (!session && isAppPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
