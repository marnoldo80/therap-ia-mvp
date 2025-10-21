import Link from "next/link";

export default function Page() {
  return (
    <main style={{maxWidth:800,margin:"40px auto",padding:20}}>
      <h1>Dashboard Terapeuta</h1>
      <p>Qui mostreremo Nome, <strong>Codice cliente</strong>, stato profilo e link agli schemi.</p>
      <div style={{display:"flex",gap:16,marginTop:24}}>
        <div style={{flex:1,border:"1px solid #ddd",borderRadius:8,padding:16}}>
          <h2>I miei schemi</h2>
          <p><Link href="/app/therapist/schemi">Apri schemi →</Link></p>
        </div>
        <div style={{flex:1,border:"1px solid #ddd",borderRadius:8,padding:16}}>
          <h2>Pazienti</h2>
          <p>
            <a href="#" onClick={(e)=>{e.preventDefault();alert("Aggiungi paziente sarà attivo nel prossimo step.");}}>
              ➕ Aggiungi paziente
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
