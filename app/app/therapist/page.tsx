export default function Page() {
  return (
    <main style={{maxWidth:800,margin:"40px auto",padding:20}}>
      <h1>Dashboard Terapeuta</h1>
      <p>Qui mostreremo Nome, <strong>Codice cliente</strong>, stato profilo e link agli schemi.</p>
      <div style={{marginTop:24}}>
        <h2>I miei schemi</h2>
        <p><a href="/app/therapist/schemi">Apri schemi →</a></p>
        <h2 style={{marginTop:16}}>Pazienti</h2>
        <p>➕ Aggiungi paziente (attivo nel prossimo step)</p>
      </div>
    </main>
  );
}
