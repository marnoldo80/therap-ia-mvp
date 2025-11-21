'use client';
import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TherapistAssistantProps {
  therapistName?: string;
}

const KNOWLEDGE_BASE = {
  // Gestione Pazienti
  "come creo un nuovo paziente": "Per creare un nuovo paziente: Dashboard → Pazienti → 'Nuovo Paziente'. Compila tutti i campi richiesti (nome, email, telefono, indirizzo completo, codice fiscale, data/luogo nascita). Dopo la creazione, potrai invitarlo tramite email per l'accesso.",
  
  "come invito un paziente": "Vai in Lista Pazienti → Click sul paziente → Tab 'Panoramica' → Bottone 'Invia invito email'. Il paziente riceverà un link per impostare la password e accedere alla sua area.",
  
  "come vedo i dati del paziente": "Vai in Lista Pazienti → Click sul nome del paziente. Vedrai 4 tab: Panoramica (dati + tariffe), Piano Terapeutico, Sedute, Risultati. Puoi modificare tariffe e durate personalizzate.",
  
  // Consenso Informato
  "come creo il consenso": "Lista Pazienti → Column 'Consenso' → 'Crea Consenso'. Il sistema precompila automaticamente tutti i dati del paziente e terapeuta. Dopo la tua firma, il paziente riceve email per firmare.",
  
  "dove vedo i consensi": "Dashboard → Widget 'Consensi' oppure Lista Pazienti → Column 'Consenso'. Stati: 'Da creare', 'In attesa paziente', 'Completato'. Click per visualizzare o scaricare PDF.",
  
  "consenso non firmato dal paziente": "Se il paziente non ha ancora firmato, puoi: 1) Reinviare l'email di notifica, 2) Condividere direttamente il link, 3) Far firmare durante la seduta dal tablet/PC.",
  
  // Appuntamenti
  "come creo un appuntamento": "3 modi: 1) Dashboard → 'Nuovo Appuntamento' → scegli data/ora → seleziona paziente, 2) Calendario → click su cella vuota, 3) Appuntamenti → 'Nuovo Appuntamento'. Il sistema precompila ora selezionata.",
  
  "come modifico un appuntamento": "Click sull'appuntamento esistente (da calendario o lista) → si apre modal modifica → cambia data/ora/paziente → salva. Il paziente può inviare messaggi sugli appuntamenti.",
  
  "calendario non funziona": "Il calendario usa click diretto sulle celle. Se non funziona: 1) Ricarica la pagina, 2) Verifica di essere in vista settimanale, 3) Click esatto sulla cella oraria desiderata.",
  
  // Sedute e Note
  "come scrivo le note seduta": "Scheda Paziente → Tab 'Sedute' → 'Nuova Seduta'. Dopo aver scritto le note, puoi generare un riassunto automatico con IA e estrarre i temi principali.",
  
  "ia per le sedute": "Nelle note sedute puoi usare l'IA per: 1) Generare riassunto automatico, 2) Estrarre temi principali, 3) Suggerimenti per il piano terapeutico. L'IA analizza tutte le sedute precedenti.",
  
  // Piano Terapeutico
  "come creo piano terapeutico": "Scheda Paziente → Tab 'Piano Terapeutico' → Compila sezioni (anamnesi, valutazione, obiettivi, esercizi). Usa il bottone 'IA' per suggerimenti automatici basati sulle sedute.",
  
  "obiettivi sincronizzati": "Gli obiettivi che inserisci sono visibili al paziente nella sua dashboard. Può spuntare le checkbox per segnare completamento. Le modifiche sono sincronizzate in tempo reale.",
  
  // Questionari
  "come invio gad7": "Questionari → GAD-7 → Seleziona paziente → 'Invia email'. Il paziente riceve link pubblico per compilare. I risultati appaiono automaticamente in 'Risultati'.",
  
  "questionario in seduta": "Questionari → GAD-7 → 'Compila in seduta' → Seleziona paziente → Fai compilare direttamente. Utile se il paziente non ha accesso email.",
  
  // Problemi Tecnici
  "paziente non riceve email": "Controlla: 1) Email corretta in anagrafica, 2) Cartella spam/promozioni, 3) Reinvia invito dalla scheda paziente, 4) Usa link diretto per login manuale.",
  
  "errore durante salvataggio": "Se errori di salvataggio: 1) Verifica connessione, 2) Ricarica pagina, 3) Ricompila form, 4) Controlla campi obbligatori (nome, email). Se persiste, contatta supporto.",
  
  "dati non sincronizzati": "Per problemi di sincronizzazione: 1) Ricarica pagina, 2) Logout/login, 3) Cancella cache browser. I dati sono salvati in tempo reale su database sicuro.",
  
  // Best Practices
  "workflow consigliato": "Workflow tipo: 1) Crea paziente con dati completi, 2) Invia invito email, 3) Crea consenso informato, 4) Primo appuntamento, 5) Piano terapeutico dopo 2-3 sedute, 6) Questionari periodici.",
  
  "organizzare sedute": "Suggerimenti: 1) Leggi 'Pensieri prossima seduta' del paziente prima dell'incontro, 2) Prendi note durante seduta, 3) Usa IA per riassunto, 4) Aggiorna obiettivi se necessario.",
  
  "privacy e sicurezza": "Il sistema è conforme GDPR. Tutti i dati sono crittografati. Solo tu puoi accedere ai tuoi pazienti. I pazienti vedono solo i propri dati. Le password sono gestite in modo sicuro.",
  
  // Navigazione
  "vai alla dashboard": "La dashboard è la pagina principale con statistiche, appuntamenti e link rapidi. Accedi da logo 'Therap-IA' o click 'Dashboard' nel menu.",
  
  "vai ai pazienti": "Lista pazienti: Dashboard → 'Pazienti' nel menu o click sul widget 'Pazienti' nella dashboard principale.",
  
  "vai al calendario": "Calendario appuntamenti: Dashboard → 'Appuntamenti' nel menu o click 'Calendario' nella dashboard per vista settimanale interattiva."
};

const QUICK_ACTIONS = [
  { label: "🏥 Come creo un paziente?", query: "come creo un nuovo paziente" },
  { label: "📧 Come invito un paziente?", query: "come invito un paziente" },
  { label: "📋 Come creo il consenso?", query: "come creo il consenso" },
  { label: "📅 Come creo appuntamenti?", query: "come creo un appuntamento" },
  { label: "📝 Come scrivo note sedute?", query: "come scrivo le note seduta" },
  { label: "🎯 Come uso il piano terapeutico?", query: "come creo piano terapeutico" },
  { label: "📊 Come invio questionari?", query: "come invio gad7" },
  { label: "⚙️ Workflow consigliato", query: "workflow consigliato" }
];

export default function TherapistAssistant({ therapistName }: TherapistAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Ciao ${therapistName || 'Dottore/ssa'}! 👨‍⚕️ Sono il tuo assistente per Therap-IA. Posso aiutarti con:\n\n• 🏥 Gestione pazienti\n• 📋 Consensi informati\n• 📅 Appuntamenti\n• 📝 Sedute e note\n• 🎯 Piani terapeutici\n• 📊 Questionari\n• ⚙️ Best practices\n\nCosa ti serve?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestAnswer = (query: string): string => {
    const normalizedQuery = query.toLowerCase();
    
    // Cerca corrispondenza esatta
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
      if (normalizedQuery.includes(key)) {
        return value;
      }
    }
    
    // Cerca parole chiave
    if (normalizedQuery.includes('pazient') && normalizedQuery.includes('cre')) {
      return KNOWLEDGE_BASE["come creo un nuovo paziente"];
    }
    
    if (normalizedQuery.includes('invit') || normalizedQuery.includes('email')) {
      return KNOWLEDGE_BASE["come invito un paziente"];
    }
    
    if (normalizedQuery.includes('consenso')) {
      return KNOWLEDGE_BASE["come creo il consenso"];
    }
    
    if (normalizedQuery.includes('appuntament') || normalizedQuery.includes('calendar')) {
      return KNOWLEDGE_BASE["come creo un appuntamento"];
    }
    
    if (normalizedQuery.includes('sedut') || normalizedQuery.includes('note')) {
      return KNOWLEDGE_BASE["come scrivo le note seduta"];
    }
    
    if (normalizedQuery.includes('piano') || normalizedQuery.includes('obiettiv')) {
      return KNOWLEDGE_BASE["come creo piano terapeutico"];
    }
    
    if (normalizedQuery.includes('questionari') || normalizedQuery.includes('gad')) {
      return KNOWLEDGE_BASE["come invio gad7"];
    }
    
    if (normalizedQuery.includes('workflow') || normalizedQuery.includes('processo')) {
      return KNOWLEDGE_BASE["workflow consigliato"];
    }
    
    if (normalizedQuery.includes('problem') || normalizedQuery.includes('error') || normalizedQuery.includes('non funzion')) {
      return "Per problemi tecnici comuni:\n\n• **Email non arrivano**: Controlla spam, email corretta, reinvia invito\n• **Errori salvataggio**: Ricarica pagina, verifica connessione\n• **Dati non sincronizzati**: Logout/login, cancella cache\n• **Calendario non risponde**: Ricarica pagina, click preciso su celle\n\nSe il problema persiste, descrivi meglio cosa succede!";
    }
    
    if (normalizedQuery.includes('aiuto') || normalizedQuery.includes('help')) {
      return "Posso aiutarti con:\n\n🏥 **Pazienti**: Creazione, inviti, gestione dati\n📋 **Consensi**: Creazione, firma, download PDF\n📅 **Appuntamenti**: Calendario, creazione, modifica\n📝 **Sedute**: Note, riassunti IA, temi\n🎯 **Piani**: Obiettivi, esercizi, sincronizzazione\n📊 **Questionari**: GAD-7, invio email, risultati\n⚙️ **Workflow**: Best practices, organizzazione\n\nFai una domanda specifica o usa i pulsanti rapidi!";
    }
    
    // Risposta generica
    return "Non ho trovato una risposta specifica per questa domanda. Prova a:\n\n• Usare i **pulsanti rapidi** qui sotto\n• Essere più specifico (es: 'come creo un paziente')\n• Chiedere di problemi comuni\n\nOppure descrivi meglio cosa stai cercando di fare! 🤔";
  };

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    const answer = findBestAnswer(textToSend);
    const assistantMessage: Message = {
      role: 'assistant',
      content: answer,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-40"
        title="Assistente Therap-IA"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="hidden lg:block font-medium">Assistente</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🩺</span>
          <div>
            <h3 className="font-semibold">Assistente Therap-IA</h3>
            <p className="text-xs opacity-90">Guida e supporto per terapeuti</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-700 p-1 rounded"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              <div className="whitespace-pre-line">{message.content}</div>
              <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t bg-gray-50">
        <div className="text-xs text-gray-600 mb-2">🚀 Domande frequenti:</div>
        <div className="grid grid-cols-2 gap-1 mb-3">
          {QUICK_ACTIONS.map((action, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(action.query)}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-left transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Fai una domanda su Therap-IA..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📤
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Premi Enter per inviare • Shift+Enter per andare a capo
        </div>
      </div>
    </div>
  );
}
