'use client';

import { useRouter } from 'next/navigation';

export default function OnboardingFatto() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-4">Perfetto!</h1>
      <p className="mb-6">
        La tua password è stata impostata. Ora puoi accedere alla tua area paziente.
      </p>
      <button
        onClick={() => router.push('/app/paziente')}
        className="rounded bg-black px-4 py-2 text-white hover:opacity-90"
      >
        Vai alla mia area
      </button>
    </main>
  );
}
