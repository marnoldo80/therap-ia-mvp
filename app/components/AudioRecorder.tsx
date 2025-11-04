'use client';
import { useState, useRef } from 'react';

type AudioRecorderProps = {
  onTranscriptComplete: (transcript: string) => void;
  onSummaryComplete: (summary: string) => void;
};

export default function AudioRecorder({ onTranscriptComplete, onSummaryComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      setError('Errore accesso microfono: ' + err.message);
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Trascrizione con Deepgram
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeRes.ok) {
        throw new Error('Errore trascrizione');
      }

      const { transcript } = await transcribeRes.json();
      onTranscriptComplete(transcript);

      // Step 2: Riassunto con Groq
      const summaryRes = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!summaryRes.ok) {
        throw new Error('Errore generazione riassunto');
      }

      const { summary } = await summaryRes.json();
      onSummaryComplete(summary);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🎙️ Registrazione Audio Seduta
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
          >
            ⏺️ Avvia Registrazione
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={stopRecording}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
            >
              ⏹️ Ferma Registrazione
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="font-mono text-lg font-semibold">{formatTime(recordingTime)}</span>
            </div>
          </>
        )}

        {audioBlob && !isProcessing && (
          <div className="flex gap-3">
            <button
              onClick={processAudio}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              ✨ Trascrivi e Genera Riassunto
            </button>
            <button
              onClick={() => {
                setAudioBlob(null);
                setRecordingTime(0);
              }}
              className="bg-gray-400 text-white px-4 py-3 rounded-lg hover:bg-gray-500"
            >
              🔄 Nuova Registrazione
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 text-blue-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="font-medium">Elaborazione in corso...</span>
          </div>
        )}
      </div>

      {audioBlob && (
        <div className="mt-4 text-sm text-gray-600">
          ✅ Registrazione completata ({formatTime(recordingTime)})
        </div>
      )}
    </div>
  );
}
