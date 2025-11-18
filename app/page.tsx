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
          .logo{height:50px; width:auto}
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
              <svg className="logo" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 13.252571492497376 4.365731177734163">
                <g transform="matrix(0.7483354044363397,0,0,0.7483354044363397,4.6322001626872495,1.6660099103635644)">
                  <rect width="14.720763381683337" height="14.720763381683337" x="-4.695686726872377" y="-6.669707862716669" fill="#ffffff"></rect>
                  <g transform="matrix(1,0,0,1,0,0)" clipPath="url(#SvgjsClipPath199601)">
                    <g clipPath="url(#SvgjsClipPath199596b8bc5013-9dd8-4651-8ced-cf80f82c0986)">
                      <path d=" M -2.139606385895866 0.9253396574614682 L -2.139606385895866 1.0589993583813024 C -2.139606385895866 1.1601746762927716 -2.2252162702824942 1.2424007707826954 -2.326053209204293 1.2461229396690703 C -2.4184306733843304 1.2491683505761046 -2.5006567678742537 1.187244995466409 -2.5229897811925044 1.0975745632037355 C -2.5253584341201973 1.085392919575599 -2.5267119500788793 1.073211275947462 -2.5267119500788793 1.0606912533296544 C -2.5267119500788793 0.9713592000566517 -2.5250200551305273 0.8820271467836484 -2.5267119500788793 0.7926950935106455 C -2.52705032906855 0.6962570814545624 -2.4563291202274224 0.6147077449439803 -2.360906245140351 0.6011725853571616 C -2.2516098314767907 0.5883141837496838 -2.1578788513380713 0.6539597077457543 -2.1426517968029004 0.7568269206055761 C -2.134530701050809 0.8116443169321915 -2.141298280844219 0.8688303661865006 -2.141298280844219 0.9250012784717979 L -2.139944764885537 0.9250012784717979 Z" fill="#173054" transform="matrix(1,0,0,1,0,0)" fillRule="nonzero"></path>
                    </g>
                    <g clipPath="url(#SvgjsClipPath199596b8bc5013-9dd8-4651-8ced-cf80f82c0986)">
                      <path d=" M -1.4794289770487872 0.922971004533775 L -1.4794289770487872 0.786604271696577 C -1.477060324121094 0.6938884285268693 -1.4090461471973301 0.616061260902662 -1.3176838199863043 0.6011725853571616 C -1.2185387760128576 0.5883141837496838 -1.1271764488018317 0.6441467170453111 -1.1014596455868766 0.7344939072873252 C -1.0960455817521493 0.7534431307088713 -1.093338549834785 0.7730691121097585 -1.093000170845115 0.7926950935106455 C -1.091985033876103 0.8786433568869437 -1.094692065793467 0.964591620263242 -1.091985033876103 1.0505398836395403 C -1.090293138927751 1.1469778956956236 -1.1603375897895374 1.229542369175217 -1.2557604648766092 1.244092665731047 C -1.3643801205608286 1.2576278253178659 -1.4550656897925136 1.1929974382908064 -1.477737082100435 1.0911453623999963 C -1.4794289770487872 1.082347508668564 -1.4797673560384577 1.0732112759474615 -1.4797673560384577 1.0640750432263588 L -1.4797673560384577 0.9229710045337748 L -1.4797673560384577 0.9229710045337748 Z" fill="#173054" transform="matrix(1,0,0,1,0,0)" fillRule="nonzero"></path>
                    </g>
                  </g>
                  <defs>
                    <clipPath id="SvgjsClipPath199601">
                      <path d=" M -3.227494837686415 -0.7580958161491008 h 2.827494837686415 v 2.8975392885482014 h -2.827494837686415 Z"></path>
                    </clipPath>
                    <clipPath id="SvgjsClipPath199596b8bc5013-9dd8-4651-8ced-cf80f82c0986">
                      <path d=" M -3.2274948376864145 -0.7580958161491008 L -0.3999999999999999 -0.7580958161491008 L -0.3999999999999999 2.1394434723991007 L -3.2274948376864145 2.1394434723991007 Z"></path>
                    </clipPath>
                  </defs>
                </g>
              </svg>
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
