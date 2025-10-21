export default function Page() {
  return (
    <main style={{maxWidth:700,margin:"40px auto",padding:24,textAlign:"center"}}>
      <h1>Therap-IA MVP</h1>
      <p style={{marginTop:8,color:"#555"}}>
        Se sei un terapeuta, registrati oppure accedi se hai già un account.
      </p>
      <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:24}}>
        <a href="/signup-terapeuta"
           style={{padding:"12px 16px",border:"1px solid #222",borderRadius:10,textDecoration:"none"}}>
          ✨ Crea utente (registrazione)
        </a>
        <a href="/login"
           style={{padding:"12px 16px",border:"1px solid #222",borderRadius:10,textDecoration:"none"}}>
          🔐 Login (già registrato)
        </a>
      </div>
    </main>
  );
}
