export default function HomePage() {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Therap-IA — Intelligenza Artificiale al Servizio del Terapeuta</title>
        <style dangerouslySetInnerHTML={{ __html: `
          :root{
            --bg:#0b0f1c; --panel:#141a2c; --ink:#f1f5ff; --muted:#a8b2d6;
            --ring:#26304b; --accent:#7aa2ff; --accent-weak:#1c2440;
          }
          *{box-sizing:border-box}
          body{
            margin:0; background:var(--bg); color:var(--ink);
            font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
            line-height:1.55;
          }
          .wrap{max-width:1100px; margin:0 auto; padding:0 20px}
          header{
            border-bottom:1px solid var(--accent-weak);
            background:linear-gradient(180deg,#10162a 0%,#0b0f1c 100%);
            padding:16px 0 10px;
          }
          .top{display:flex; align-items:flex-end; gap:12px; justify-content:space-between; flex-wrap:wrap}
          .wordmark{font-size:44px; font-weight:900; letter-spacing:.3px; margin:0; line-height:1.05}
          .subtitle{margin:6px 0 0; color:var(--muted); font-size:18px}
          .section{padding:18px 0}
          h2.sec{font-size:24px; margin:6px 0 10px}
          p.lead{color:var(--muted); font-size:18px; margin:0}
          .grid{display:grid; gap:16px; grid-template-columns:repeat(6,1fr)}
          @media (max-width:1100px){.grid{grid-template-columns:repeat(3,1fr)}}
          @media (max-width:720px){.grid{grid-template-columns:repeat(1,1fr)}}
          .card{
            background:var(--panel); border:1px solid var(--ring);
            border-radius:16px; padding:16px 16px 14px;
            box-shadow:0 10px 28px rgba(0,0,0,.25);
          }
          .card h3{margin:0 0 6px; font-size:18px}
          .card p{margin:0; color:var(--muted)}
          .cols{display:grid; gap:22px; grid-template-columns:1.3fr 1fr}
          @media (max-width:900px){.cols{grid-template-columns:1fr}}
          .cta{
            display:inline-block; background:var(--accent); color:#0b1022;
            text-decoration:none; padding:12px 18px; border-radius:12px;
            font-weight:850; letter-spacing:.25px;
            box-shadow:0 10px 24px rgba(122,162,255,.18); margin-top:10px;
          }
          .cta:hover{filter:brightness(.96)}
          .btn-login{
            background:transparent; border:1px solid var(--accent);
            color:var(--accent); padding:8px 16px; border-radius:8px;
            text-decoration:none; font-size:14px; font-weight:600;
          }
          .btn-login:hover{background:var(--accent-weak)}
          footer{padding:24px 0 34px; color:var(--muted); font-size:13px; text-align:center}
        `}} />
      </head>
      <body>
        <header>
          <div className="wrap">
            <div className="top">
              <h1 className="wordmark">Therap-IA</h1>
              <a href="/login" className="btn-login">Accedi Demo</a>
            </div>
            <p className="subtitle">
              Intelligenza Artificiale al Servizio del Terapeuta — promemoria agenda, note e sintesi,
              piani di intervento e assistente tra le sedute. Controllo sempre al professionista.
            </p>
          </div>
        </header>

        <main className="wrap">
          <section className="section">
            <h2 className="sec">Cos'è Therap-IA?</h2>
            <p className="lead">
              Supporto operativo per terapeuti: agenda e promemoria, documentazione post-seduta con
              riassunti strutturati, piani di intervento (focus ansia) e un assistente tra le sedute
              per check-in, esercizi e diario guidato.
            </p>
          </section>

          <section className="section">
            <h2 className="sec">Funzionalità principali</h2>
            <div className="grid">
              <div className="card">
                <h3>Gestione agenda</h3>
                <p>Appuntamenti e promemoria automatici per ridurre no-show.</p>
              </div>
              <div className="card">
                <h3>Note e sintesi</h3>
                <p>Riassunti post-seduta, esportabili in PDF/Doc.</p>
              </div>
              <div className="card">
                <h3>Piani di intervento</h3>
                <p>Template per ansia (GAD/panico/sociale/fobie) personalizzabili.</p>
              </div>
              <div className="card">
                <h3>Assistente tra sedute</h3>
                <p>Check-in brevi, reminder esercizi, sintesi settimanali.</p>
              </div>
              <div className="card">
                <h3>1-pager pre-seduta</h3>
                <p>Trend, compiti, segnali chiave in una pagina.</p>
              </div>
              <div className="card">
                <h3>Privacy & controllo</h3>
                <p>Consenso paziente, orari silenziosi, dati in UE.</p>
              </div>
            </div>
          </section>

          <section className="section cols">
            <div>
              <h2 className="sec">Partecipa al questionario</h2>
              <p className="lead">
                8–10 minuti. Ci aiuta a capire priorità e condizioni per la fase di prova.
                <br /><strong>Compila il questionario e ricevi accesso alla demo.</strong>
              </p>
              <a className="cta" href="https://forms.gle/GZoeNtmTmfL1ThUN8" target="_blank" rel="noopener">
                Apri il questionario
              </a>
            </div>
            <div>
              <h2 className="sec">Privacy e protezione dati</h2>
              <p className="lead">
                L'email viene richiesta solo per eventuale follow-up. Nessuna lista promozionale;
                puoi chiedere la cancellazione in qualsiasi momento.
              </p>
            </div>
          </section>
        </main>

        <footer>
          © Therap-IA — materiale informativo per la raccolta di feedback professionali
        </footer>
      </body>
    </html>
  );
}
