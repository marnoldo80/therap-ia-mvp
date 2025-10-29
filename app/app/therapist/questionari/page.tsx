'use client';
import Link from 'next/link';

const questionari = [
  {
    id: 'gad7',
    name: 'GAD-7',
    description: 'Questionario per ansia generalizzata',
    icon: '📋',
  },
  // Altri questionari in futuro
];

export default function QuestionariPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="mb-4">
        <Link href="/app/therapist" className="text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <h1 className="text-3xl font-bold">Questionari</h1>
      <p className="text-gray-600">Seleziona un questionario da somministrare</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questionari.map((q) => (
          <Link
            key={q.id}
            href={`/app/therapist/questionari/${q.id}`}
            className="block border rounded-lg p-6 bg-white hover:shadow-lg transition"
          >
            <div className="text-4xl mb-3">{q.icon}</div>
            <h3 className="font-semibold text-xl mb-2">{q.name}</h3>
            <p className="text-sm text-gray-600">{q.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
