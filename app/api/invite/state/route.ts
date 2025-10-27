// app/api/invite/state/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") ?? "";
    if (!token) return NextResponse.json({ ok: false, reason: "invalid_token" });

    // Trova invito
    const { data: invite, error: invErr } = await supabase
      .from("patient_invites")
      .select("patient_id, expires_at")
      .eq("token", token)
      .single();

    if (invErr || !invite) return NextResponse.json({ ok: false, reason: "invalid_token" });

    const exp = new Date(invite.expires_at);
    if (isNaN(exp.getTime()) || exp < new Date()) {
      return NextResponse.json({ ok: false, reason: "expired" });
    }

    const patientId = invite.patient_id;

    // Ha già accettato privacy?
    const { data: consentRows } = await supabase
      .from("consents")
      .select("id")
      .eq("patient_id", patientId)
      .eq("consent_type", "privacy")
      .eq("accepted", true)
      .limit(1);

    const hasPrivacyConsent = !!(consentRows && consentRows.length > 0);

    // Onboarding completato?
    const { data: patient } = await supabase
      .from("patients")
      .select("onboarding_completed_at")
      .eq("id", patientId)
      .single();

    const onboardingCompleted = !!patient?.onboarding_completed_at;

    return NextResponse.json({ ok: true, patientId, hasPrivacyConsent, onboardingCompleted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: "error", message: e?.message ?? "Unexpected" });
  }
}
