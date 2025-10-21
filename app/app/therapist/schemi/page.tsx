export default function Page() {
  return (
    <main style={{maxWidth:800,margin:"40px auto",padding:20}}>
      <h1>Schemi (sola lettura)</h1>
      <section style={{marginTop:24}}>
        <h2>Schema Builder del Piano</h2>
        <ul>
          <li><strong>Obiettivo</strong> — Cosa vogliamo ottenere?</li>
          <li><strong>Intervento/Compito</strong> — Che azione fa il paziente?</li>
          <li><strong>Frequenza</strong> — Quante volte a settimana?</li>
          <li><strong>Scadenza</strong> — Entro quando?</li>
          <li><strong>Note cliniche</strong> — Osservazioni del terapeuta</li>
        </ul>
      </section>
      <section style={{marginTop:24}}>
        <h2>Schema Riassunto della Seduta</h2>
        <ol>
          <li>Motivo della seduta</li>
          <li>Pensieri automatici</li>
          <li>Emozioni e intensità</li>
          <li>Comportamenti/Evitamenti</li>
          <li>Micro-piano settimanale</li>
        </ol>
      </section>
    </main>
  );
}
