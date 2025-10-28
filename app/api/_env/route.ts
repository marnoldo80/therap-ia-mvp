import { NextResponse } from 'next/server';

export async function GET() {
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE;
  const serviceRoleLen = (process.env.SUPABASE_SERVICE_ROLE || '').length;

  return NextResponse.json({
    ok: true,
    hasServiceRole,
    serviceRoleLen,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null,
    NODE_ENV: process.env.NODE_ENV || null,
    vercelProject: process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || null,
  });
}
