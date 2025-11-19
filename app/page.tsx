export default function HomePage() {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>cIAo-doc — Intelligenza Artificiale al Servizio del Terapeuta</title>
        <style dangerouslySetInnerHTML={{ __html: `
          :root{
            --bg:#0b0f1c; --panel:#141a2c; --ink:#f1f5ff; --muted:#a8b2d6;
            --ring:#26304b; --accent:#7aa2ff; --accent-weak:#1c2440;
            --purple-start:#9d4edd; --purple-end:#c77dff;
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
            padding:20px 0 16px;
          }
          .header-content{display:flex; align-items:center; gap:16px; margin-bottom:12px}
          .logo{height:80px; width:auto}
          .subtitle{margin:0; color:var(--ink); font-size:18px; font-weight:500}
          .section{padding:24px 0}
          h2.sec{font-size:24px; margin:6px 0 16px; color:var(--ink)}
          p.lead{color:var(--muted); font-size:18px; margin:0; line-height:1.6}
          .features-grid{display:grid; gap:16px; grid-template-columns:repeat(2,1fr); margin-top:20px}
          @media (max-width:768px){.features-grid{grid-template-columns:1fr}}
          .feature-card{
            background:linear-gradient(135deg,var(--purple-start) 0%,var(--purple-end) 100%);
            border-radius:12px; padding:20px; color:#ffffff;
            box-shadow:0 8px 24px rgba(157,78,221,.2);
          }
          .feature-card h3{margin:0 0 8px; font-size:18px; font-weight:700}
          .feature-card p{margin:0; font-size:14px; opacity:0.95; line-height:1.5}
          .cta-section{
            background:var(--panel); border:1px solid var(--ring);
            border-radius:16px; padding:24px; margin:16px 0;
            box-shadow:0 10px 28px rgba(0,0,0,.25);
          }
          .cta-section h3{margin:0 0 12px; font-size:20px; color:var(--ink)}
          .cta-section p{margin:0 0 16px; color:var(--muted); line-height:1.6}
          .cta{
            display:inline-block; background:var(--accent); color:#0b1022;
            text-decoration:none; padding:12px 24px; border-radius:12px;
            font-weight:700; letter-spacing:.3px; font-size:14px;
            box-shadow:0 8px 20px rgba(122,162,255,.25);
            transition:all 0.2s ease;
          }
          .cta:hover{transform:translateY(-1px); box-shadow:0 10px 24px rgba(122,162,255,.35)}
          .cta-purple{
            background:linear-gradient(135deg,var(--purple-start) 0%,var(--purple-end) 100%);
            color:#ffffff;
            box-shadow:0 8px 20px rgba(157,78,221,.25);
          }
          .cta-purple:hover{box-shadow:0 10px 24px rgba(157,78,221,.35)}
          footer{padding:32px 0; color:var(--muted); font-size:13px; text-align:center; border-top:1px solid var(--accent-weak)}
        `}} />
      </head>
      <body>
        <header>
          <div className="wrap">
            <div className="header-content">
              <img 
                src="/logo-transparent-png.png" 
                alt="cIAo-doc" 
                className="logo"
              />
            </div>
            <p className="subtitle">Intelligenza Artificiale al Servizio del Terapeuta</p>
          </div>
        </header>

        <main className="wrap">
          <section className="section">
            <h2 className="sec">Cos'è cIAo-doc?</h2>
            <p className="lead">
              Il nostro obiettivo è offrire al professionista un supporto operativo per la gestione della 
              propria attività con i pazienti.
            </p>

            <div className="features-grid">
              <div className="feature-card">
                <h3>Gestione agenda</h3>
                <p>Appuntamenti e promemoria automatici per ridurre no-show.</p>
              </div>
              
              <div className="feature-card">
                <h3>Gestione Seduta</h3>
                <p>Registrazione, Riassunti post-seduta, definizione punti salienti</p>
              </div>
              
              <div className="feature-card">
                <h3>Piano di Intervento</h3>
                <p>Somministrazione questionari e registrazione risultati. Definizione Obiettivi ed Esercizi</p>
              </div>
              
              <div className="feature-card">
                <h3>Assistente tra sedute</h3>
                <p>Reminder esercizi inviati al paziente, sintesi settimanali.<br/>Raccolta feedback paziente attraverso chat automatica.</p>
              </div>
            </div>
          </section>

          <section className="section">
            <p style={{textAlign: 'center', fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: 'var(--ink)'}}>
              Chiediamo il tuo supporto per valutare la nostra proposta ed i miglioramenti necessari
            </p>
            <p style={{textAlign: 'center', fontSize: '16px', marginBottom: '32px', color: 'var(--muted)'}}>
              Per questo ti chiediamo di:
            </p>

            <div className="cta-section">
              <h3>Partecipare al questionario</h3>
              <p>
                8-10 minuti. Ci aiuta a capire priorità e condizioni per la fase di prova. 
                L'email viene richiesta solo per eventuale follow-up. Nessuna lista promozionale; 
                puoi chiedere la cancellazione in qualsiasi momento.
              </p>
              <a className="cta cta-purple" href="https://forms.gle/GZoeNtmTmfL1ThUN8" target="_blank" rel="noopener">
                Apri il questionario
              </a>
            </div>

            <div className="cta-section">
              <h3>Accedi alla Demo</h3>
              <p>
                Prova ad accedere alla piattaforma, se vuoi puoi iscriverti per navigare nelle varie 
                funzioni e valutare se sia la nostra proposta.
              </p>
              <a className="cta" href="/login">
                Accedi Demo
              </a>
            </div>
          </section>
        </main>

        <footer>
          <div className="wrap">
            © cIAo-doc — materiale informativo per la raccolta di feedback professionali
          </div>
        </footer>
      </body>
    </html>
  );
}
