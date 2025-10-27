'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [pwd1, setPwd1] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace('/');
      }
    })();
  }, [router, supabase]);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pwd1.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (pwd1 !== pwd2) {
      setError('Le password non coincidono.');
      return;
    }

    setSubmitting(true)


cat > app/onboarding/cambia-password/page.tsx <<'EOF'
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [pwd1, setPwd1] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace('/');
      }
    })();
  }, [router, supabase]);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pwd1.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (pwd1 !== pwd2) {
      setError('Le password non coincidono.');
      return;
    }

    setSubmitting(true)


cat > app/onboarding/cambia-password/page.tsx <<'EOF'
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [pwd1, setPwd1] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace('/');
      }
    })();
  }, [router, supabase]);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pwd1.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (pwd1 !== pwd2) {
      setError('Le password non coincidono.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: upErr } = await supabase.auth.updateUser({ password: pwd1 });
      if (upErr) throw upErr;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sessione scaduta');

      const { error: upd } = await supabase
        .from('patients')
        .update({ must_change_password: false })
        .eq('user_id', session.user.id);
      if (upd) throw upd;

      const { data: patient, error: pErr } = await supabase
        .from('patients')
        .select('consent_required, consent_accepted_at')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (pErr) throw pErr;

      const needsConsent = !patient || patient.consent_required || !patient.consent_accepted_at;
      if (needsConsent) {
        router.replace('/onboarding/consenso');
      } else {
        router.replace('/app/paziente');
      }
    } catch (e: any) {
      setError(e.message ?? 'Errore nel cambio password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Imposta una nuova password</h1>
      <p className="text-sm text-muted-foreground">
        Al primo accesso devi impostare una password personale.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleChange} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nuova password</label>
          <input
            type="password"
            className="w-full border rounded-xl px-3 py-2"
            value={pwd1}
            onChange={e => setPwd1(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Conferma nuova password</label>
          <input
            type="password"
            className="w-full border rounded-xl px-3 py-2"
            value={pwd2}
            onChange={e => setPwd2(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl px-4 py-3 shadow-sm border font-medium hover:opacity-90"
        >
          {submitting ? 'Salvataggio…' : 'Salva e continua'}
        </button>
      </form>
    </div>
  );
}
