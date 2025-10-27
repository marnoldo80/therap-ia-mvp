'use client';

import { useRouter } from 'next/navigation';

export default function IntroPaziente() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-4">Benvenuto/a</h1>
      <p className="mb-3">
        Sei stato invitato dal tuo terapeuta. Il tuo <strong>username è la tua email</strong>.
      </p>
      <p className="mb-6">
        Premi il pulsante qui sotto per <strong>creare la tua password</strong> e completare l’accesso.
      </p>
      <button
        onClick={() => router.push('/onboarding/cambia-password')}
        className="rounded bg-black px-4 py-2 text-white hover:opacity-90"
      >
        Crea password
      </button>
    </main>
  );
}
