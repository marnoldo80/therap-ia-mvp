import Link from "next/link";

export default function Page() {
  return (
    <main style={{maxWidth:680,margin:"40px auto",padding:20}}>
      <h1>Iscrizione Terapeuta</h1>
      <p>Qui metteremo il form vero nel prossimo step.</p>
      <p style={{marginTop:24}}>
        Prosegui all’onboarding → <Link href="/app/therapist/onboarding">/app/therapist/onboarding</Link>
      </p>
    </main>
  );
}
