interface AssistantTipsProps {
  className?: string;
}

const QUICK_TIPS = [
  {
    icon: "🚀",
    title: "Inizia subito",
    tip: "Crea il tuo primo paziente e invia l'invito email per farlo accedere alla sua area personale."
  },
  {
    icon: "📋", 
    title: "Consenso informato",
    tip: "Dopo aver creato un paziente, genera il consenso informato precompilato e firmalo digitalmente."
  },
  {
    icon: "🤖",
    title: "Usa l'IA",
    tip: "L'assistente IA può suggerirti piani terapeutici e riassumere automaticamente le sedute."
  },
  {
    icon: "📱",
    title: "Chatbot assistente", 
    tip: "Clicca l'icona 🩺 in basso a destra per aprire l'assistente e ricevere aiuto immediato."
  }
];

export default function AssistantTips({ className = "" }: AssistantTipsProps) {
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💡</span>
        <h3 className="text-lg font-semibold text-blue-800">Tips per iniziare</h3>
      </div>
      
      <div className="space-y-4">
        {QUICK_TIPS.map((tip, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
            <span className="text-lg flex-shrink-0">{tip.icon}</span>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">{tip.title}</h4>
              <p className="text-sm text-gray-600">{tip.tip}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-600 text-white rounded-lg text-center">
        <p className="text-sm font-medium">
          🩺 Hai domande? Clicca sull'assistente in basso a destra!
        </p>
      </div>
    </div>
  );
}
