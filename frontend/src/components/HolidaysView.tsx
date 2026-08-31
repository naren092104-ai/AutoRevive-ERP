import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Sparkles, MapPin, Tag } from 'lucide-react';
import { apiUrl } from '../api/client';

export const HolidaysView: React.FC = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed (7 = August)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [newHoliday, setNewHoliday] = useState({
    name: '',
    holiday_date: '2026-08-15',
    day_name: 'Saturday',
    holiday_type: 'National Holiday',
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const loadHolidays = async () => {
    try {
      const res = await fetch(apiUrl('/holidays'));
      const data = await res.json();
      if (data.success) {
        setHolidays(data.holidays || []);
      }
    } catch (err) {
      console.warn('Could not load holidays:', err);
    }
  };

  useEffect(() => {
    void loadHolidays();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/holidays'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHoliday),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || 'Holiday added to calendar.');
        setIsAddModalOpen(false);
        setNewHoliday({ name: '', holiday_date: '2026-08-15', day_name: 'Saturday', holiday_type: 'National Holiday' });
        void loadHolidays();
      }
    } catch (err) {
      setStatusMessage('Error adding holiday.');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!window.confirm('Delete this holiday from the official calendar?')) return;
    try {
      const res = await fetch(apiUrl(`/holidays/${id}`), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Holiday removed from calendar.');
        void loadHolidays();
      }
    } catch (err) {
      setStatusMessage('Error removing holiday.');
    }
  };

  // Calendar math for monthly grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const calendarDays: Array<{
    dayNumber: number;
    isCurrentMonth: boolean;
    dateString: string;
    holiday?: any;
    isWeekend: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateString: ds,
      isWeekend: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday / Saturday

    // Match holiday
    const h = holidays.find((hol) => {
      const hd = (hol.holiday_date || '').split('T')[0];
      return hd === ds;
    });

    calendarDays.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateString: ds,
      holiday: h,
      isWeekend,
    });
  }

  // Next month leading days to complete 35 or 42 grid cells
  const remaining = 35 - calendarDays.length > 0 ? 35 - calendarDays.length : 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateString: ds,
      isWeekend: false,
    });
  }

  // Holidays in current month
  const currentMonthHolidays = holidays.filter((h) => {
    const hd = (h.holiday_date || '').split('T')[0];
    const [y, m] = hd.split('-');
    return Number(y) === currentYear && Number(m) === currentMonth + 1;
  });

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Toast */}
      {statusMessage && (
        <div className="bg-orange-50 border border-orange-200 text-slate-800 text-xs px-4 py-2.5 rounded-xl flex justify-between items-center shadow-2xs">
          <span className="font-semibold">{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Top Header & Month Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 text-[#EA580C] border border-orange-200">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-xs text-slate-500">
              AutoRevive Official Paid &amp; Government Holiday Matrix
            </p>
          </div>
        </div>

        {/* Month Navigation & Add Holiday */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Holiday</span>
          </button>
        </div>
      </div>

      {/* Main Grid Split: Left 8 Cols (Interactive Calendar) & Right 4 Cols (Month Holidays List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-3">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-100 pb-3">
            <div className="text-rose-600">Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-blue-600">Sat</div>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, idx) => {
              const isToday =
                cell.dateString === new Date().toISOString().split('T')[0];
              const hasHoliday = !!cell.holiday;
              const isNational = cell.holiday?.holiday_type?.includes('National');
              const isFestival = cell.holiday?.holiday_type?.includes('Festival') || cell.holiday?.holiday_type?.includes('Govt');

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/50 border-slate-100 text-slate-300 opacity-60'
                      : hasHoliday
                      ? isNational
                        ? 'bg-orange-50/80 border-[#EA580C] shadow-2xs'
                        : isFestival
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                        : 'bg-blue-50/80 border-blue-400 shadow-2xs'
                      : isToday
                      ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-300'
                      : cell.isWeekend
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs font-extrabold font-mono ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[10px]'
                          : hasHoliday
                          ? 'text-slate-900 font-bold'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasHoliday && (
                      <span className="w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-white" />
                    )}
                  </div>

                  {hasHoliday && (
                    <div className="mt-1">
                      <p
                        className={`text-[10px] font-bold leading-tight line-clamp-2 ${
                          isNational
                            ? 'text-[#EA580C]'
                            : isFestival
                            ? 'text-emerald-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {cell.holiday.name}
                      </p>
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase ${
                          isNational
                            ? 'bg-orange-100 text-[#EA580C]'
                            : isFestival
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {cell.holiday.holiday_type?.replace(' Holiday', '')}
                      </span>
                    </div>
                  )}

                  {!hasHoliday && cell.isWeekend && cell.isCurrentMonth && (
                    <span className="text-[9.5px] text-slate-400 font-medium self-end">
                      Weekend
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Current Month Holidays & Year Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Month Holidays Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {monthNames[currentMonth]} Holidays ({currentMonthHolidays.length})
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#EA580C]">
                Official Paid
              </span>
            </div>

            <div className="space-y-2.5">
              {currentMonthHolidays.length > 0 ? (
                currentMonthHolidays.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 space-y-1 transition-colors flex items-start justify-between"
                  >
                    <div>
                      <span className="text-[9.5px] font-bold text-[#EA580C] uppercase bg-orange-50 px-2 py-0.5 rounded">
                        {h.holiday_type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 pt-1">{h.name}</h4>
                      <p className="text-[11px] font-mono text-slate-600 font-bold">
                        {(h.holiday_date || '').split('T')[0]} • {h.day_name}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No public holidays scheduled for {monthNames[currentMonth]}.
                </p>
              )}
            </div>
          </div>

          {/* Full Year Government Holidays Quick Reference */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 max-h-[380px] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              All 2026 Public &amp; Govt Holidays ({holidays.length})
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {holidays.map((h) => (
                <div key={h.id} className="pt-2 first:pt-0 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 truncate max-w-[200px]">{h.name}</p>
                    <p className="text-[10.5px] font-mono text-slate-500">{(h.holiday_date || '').split('T')[0]} ({h.day_name})</p>
                  </div>
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                    {h.holiday_type?.replace(' Holiday', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Company / Government Holiday</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tamil New Year or Founder's Day"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.holiday_date}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                      setNewHoliday({ ...newHoliday, holiday_date: e.target.value, day_name: dayName });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Day of Week</label>
                  <input
                    type="text"
                    readOnly
                    value={newHoliday.day_name}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Holiday Type</label>
                <select
                  value={newHoliday.holiday_type}
                  onChange={(e) => setNewHoliday({ ...newHoliday, holiday_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>National Holiday</option>
                  <option>Govt / State Festival</option>
                  <option>Public Holiday</option>
                  <option>Company Holiday</option>
                  <option>Optional Holiday</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Holiday to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HolidaysView;
