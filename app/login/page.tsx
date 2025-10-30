import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">THERAP-IA</h1>
          <p className="text-xl text-gray-600">Scegli il tipo di accesso</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-blue-500 transition-all">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Sono un Terapeuta</h2>
              <p className="text-gray-600 mb-6">Gestisci i tuoi pazienti, appuntamenti e piani terapeutici</p>
              
              <div className="space-y-3">
                <Link href="/login/terapeuta?mode=signup" className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center">
                  Registrati
                </Link>
                <Link href="/login/terapeuta?mode=login" className="block w-full bg-white text-blue-600 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors text-center">
                  Accedi
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-green-500 transition-all">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Sono un Paziente</h2>
              <p className="text-gray-600 mb-6">Accedi ai tuoi appuntamenti, questionari e piano terapeutico</p>
              
              <div className="space-y-3">
                <Link href="/login/paziente" className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center">
                  Accedi
                </Link>
                <div className="text-sm text-gray-500 mt-2">Il tuo account viene creato dal terapeuta</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
