import Link from "next/link";

export default function Page() {
  return (
    <main style={{maxWidth:680,margin:"40px auto",padding:20}}>
      <h1>Onboarding Terapeuta</h1>
      <p>Qui metteremo il form con Dati fiscali e contatto. Salvando si crea la tua scheda e il Codice cliente.</p>
      <p style={{marginTop:24}}>Vai alla dashboard → <Link href="/app/therapist">/app/therapist</Link></p>
    </main>
  );
}
