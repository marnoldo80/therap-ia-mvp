'use client';
import { useState } from 'react';

type CalendarPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDateTime: (dateTime: string) => void;
};

function getWeekDays(weekOffset: number = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function CalendarPicker({ isOpen, onClose, onSelectDateTime }: CalendarPickerProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  if (!isOpen) return null;

  const weekDays = getWeekDays(weekOffset);
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 - 22:00

  function handleCellClick(day: Date, hour: number) {
    const selectedDateTime = new Date(day);
    selectedDateTime.setHours(hour, 0, 0, 0);
    onSelectDateTime(selectedDateTime.toISOString());
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📅 Seleziona Data e Ora</h2>
              <p className="text-sm opacity-90 mt-1">Clicca su uno slot per creare l'appuntamento</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-4">
            <button 
              onClick={() => setWeekOffset(weekOffset - 1)} 
              className="px-4 py-2 bg-white border hover:bg-gray-100 rounded-lg font-medium transition"
            >
              ← Settimana Precedente
            </button>
            <div className="font-semibold text-lg">
              {weekDays[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <button 
              onClick={() => setWeekOffset(weekOffset + 1)} 
              className="px-4 py-2 bg-white border hover:bg-gray-100 rounded-lg font-medium transition"
            >
              Settimana Successiva →
            </button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left w-24 sticky left-0 bg-gray-50 font-semibold">Ora</th>
                  {weekDays.map((day, i) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <th key={i} className="p-3 text-center min-w-32">
                        <div className={`font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                          {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm ${isToday ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                          {day.getDate()}
                        </div>
                        {isToday && <div className="text-xs text-blue-600">Oggi</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium text-gray-700 sticky left-0 bg-white">
                      {hour}:00
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const cellDateTime = new Date(day);
                      cellDateTime.setHours(hour, 0, 0, 0);
                      const isPast = cellDateTime < new Date();
                      
                      return (
                        <td 
                          key={dayIndex} 
                          onClick={() => !isPast && handleCellClick(day, hour)}
                          className={`p-2 border-l ${
                            isPast 
                              ? 'bg-gray-100 cursor-not-allowed' 
                              : 'cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition'
                          }`}
                        >
                          <div className={`
                            h-16 flex items-center justify-center rounded
                            ${isPast ? 'text-gray-400' : 'text-gray-600 hover:text-blue-600 hover:font-medium'}
                          `}>
                            {isPast ? '—' : '+ Crea'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center pt-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
