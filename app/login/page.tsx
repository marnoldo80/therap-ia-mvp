import Link from 'next/link';

export default function LoginPage() {
  return (
    <>
      <style jsx global>{`
        *{box-sizing:border-box}
        body{
          margin:0; padding:0;
          font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
          background:linear-gradient(180deg,#10162a 0%,#0b0f1c 100%);
          min-height:100vh;
        }
      `}</style>
      <style jsx>{`
        .container{
          min-height:100vh; 
          display:flex; 
          align-items:center; 
          justify-content:center;
          padding:20px;
          width:100%;
        }
        .login-wrapper{
          display:flex;
          flex-direction:column;
          align-items:center;
          width:100%;
          max-width:900px;
        }
        .header{
          text-align:center; 
          margin-bottom:48px;
        }
        .logo{height:140px; width:auto; margin-bottom:16px}
        .subtitle{
          margin:16px 0 0 0; 
          color:#a8b2d6; 
          font-size:20px; 
          font-weight:500;
        }
        .cards-grid{
          display:flex; 
          gap:24px; 
          justify-content:center;
          width:100%;
        }
        .card{
          width:350px;
          background:#141a2c; 
          border:2px solid #26304b;
          border-radius:20px; 
          padding:32px; 
          text-align:center;
          box-shadow:0 12px 32px rgba(0,0,0,.3);
          transition:all 0.3s ease;
        }
        .card:hover{
          border-color:#7aa2ff; transform:translateY(-4px);
          box-shadow:0 16px 40px rgba(122,162,255,.2);
        }
        .card.green:hover{
          border-color:#10b981; 
          box-shadow:0 16px 40px rgba(16,185,129,.2);
        }
        .icon-circle{
          width:80px; height:80px; border-radius:50%; 
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 24px;
        }
        .icon-blue{background:linear-gradient(135deg,#7aa2ff,#5b9cff)}
        .icon-green{background:linear-gradient(135deg,#10b981,#34d399)}
        .icon{width:40px; height:40px; color:white}
        .card h2{
          margin:0 0 12px; font-size:24px; font-weight:700; color:#f1f5ff;
        }
        .card p{
          margin:0 0 24px; color:#a8b2d6; font-size:16px; line-height:1.5;
        }
        .buttons{display:flex; flex-direction:column; gap:12px}
        .btn{
          display:block; padding:14px 24px; border-radius:12px; 
          font-weight:700; font-size:16px; text-decoration:none;
          text-align:center; transition:all 0.3s ease; border:2px solid transparent;
        }
        .btn-primary{
          background:#7aa2ff; color:#0b1022; 
          box-shadow:0 8px 20px rgba(122,162,255,.25);
        }
        .btn-primary:hover{
          transform:translateY(-2px); 
          box-shadow:0 12px 28px rgba(122,162,255,.35);
        }
        .btn-secondary{
          background:transparent; color:#7aa2ff; border-color:#7aa2ff;
        }
        .btn-secondary:hover{
          background:#7aa2ff; color:#0b1022;
          transform:translateY(-2px);
        }
        .btn-green{
          background:#10b981; color:white;
          box-shadow:0 8px 20px rgba(16,185,129,.25);
        }
        .btn-green:hover{
          background:#059669; transform:translateY(-2px);
          box-shadow:0 12px 28px rgba(16,185,129,.35);
        }
        .note{
          margin-top:12px; font-size:14px; color:#a8b2d6; opacity:0.8;
        }
      `}</style>
      
      <div className="container">
        <div className="login-wrapper">
          <div className="header">
            <img 
              src="/logo-transparent-png.png" 
              alt="cIAo-doc" 
              className="logo"
            />
            <p className="subtitle">Scegli il tipo di accesso</p>
          </div>
          
          <div className="cards-grid">
            <div className="card">
              <div className="icon-circle icon-blue">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2>Sono un Terapeuta</h2>
              <p>Gestisci i tuoi pazienti, appuntamenti e piani terapeutici</p>
              
              <div className="buttons">
                <Link href="/login/terapeuta?mode=signup" className="btn btn-primary">
                  Registrati
                </Link>
                <Link href="/login/terapeuta?mode=login" className="btn btn-secondary">
                  Accedi
                </Link>
              </div>
            </div>

            <div className="card green">
              <div className="icon-circle icon-green">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2>Sono un Paziente</h2>
              <p>Accedi ai tuoi appuntamenti, questionari e piano terapeutico</p>
              
              <div className="buttons">
                <Link href="/login/paziente" className="btn btn-green">
                  Accedi
                </Link>
                <div className="note">Il tuo account viene creato dal terapeuta</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
