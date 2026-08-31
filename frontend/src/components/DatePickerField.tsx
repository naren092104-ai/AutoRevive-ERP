import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (formattedDate: string) => void;
  className?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Utility to parse arbitrary date strings into a JavaScript Date object
 */
function parseDateString(str: string): Date {
  if (!str) return new Date();
  
  // Try direct Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try "DD MMMM YYYY" (e.g. "03 November 2026" or "3 Nov 2026")
  const parts = str.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(monthStr));
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return new Date(year, monthIndex, day);
    }
  }

  // Try "DD/MM/YYYY" or "DD-MM-YYYY"
  const slashParts = str.split(/[-/]/);
  if (slashParts.length === 3) {
    const p1 = parseInt(slashParts[0], 10);
    const p2 = parseInt(slashParts[1], 10);
    const p3 = parseInt(slashParts[2], 10);
    if (p3 > 1000) {
      // DD/MM/YYYY
      return new Date(p3, p2 - 1, p1);
    } else if (p1 > 1000) {
      // YYYY/MM/DD
      return new Date(p1, p2 - 1, p3);
    }
  }

  return new Date();
}

/**
 * Format Date into corporate standard: "03 November 2026"
 */
function formatDateToStandard(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format Date to YYYY-MM-DD for native input
 */
function formatDateToISO(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  className = '',
  placeholder = 'Select date'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const initialDate = parseDateString(value);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() || new Date().getMonth());

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    onChange(formatDateToStandard(newDate));
    setIsOpen(false);
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);
    onChange(formatDateToStandard(newDate));
  };

  const handleQuickSet = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    onChange(formatDateToStandard(d));
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setIsOpen(false);
  };

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
  
  const currentDateParsed = parseDateString(value);
  const isSelected = (day: number) => {
    return (
      currentDateParsed.getDate() === day &&
      currentDateParsed.getMonth() === viewMonth &&
      currentDateParsed.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block font-semibold text-slate-700 mb-1 text-xs flex items-center justify-between">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => {
            if (nativeInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
              try {
                (nativeInputRef.current as any).showPicker();
              } catch {
                setIsOpen(!isOpen);
              }
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className="text-[#EA580C] hover:text-[#c2410c] text-[11px] flex items-center gap-1 font-medium cursor-pointer"
        >
          <CalendarIcon className="w-3 h-3" />
          <span>Pick Date</span>
        </button>
      </label>

      {/* Input container with direct text + trigger button */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded text-xs text-slate-900 font-medium bg-white focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none shadow-xs"
        />

        {/* Calendar Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-1.5 p-1 text-slate-500 hover:text-[#EA580C] hover:bg-orange-50 rounded transition-colors"
          title="Open interactive calendar"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* Hidden native date picker fallback */}
        <input
          ref={nativeInputRef}
          type="date"
          className="sr-only"
          value={formatDateToISO(initialDate)}
          onChange={handleNativeDateChange}
        />
      </div>

      {/* Interactive Calendar Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-3 select-none text-slate-800 animate-in fade-in zoom-in-95 duration-100 font-sans">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-xs text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex gap-1 mb-2.5 pb-2 border-b border-slate-100 text-[10px]">
            <button
              type="button"
              onClick={() => handleQuickSet(0)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-[#EA580C] rounded font-medium transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickSet(7)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-[#EA580C] rounded font-medium transition-colors"
            >
              +7 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickSet(14)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-[#EA580C] rounded font-medium transition-colors"
            >
              +14 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickSet(30)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-[#EA580C] rounded font-medium transition-colors"
            >
              +1 Month
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots for starting day of week */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-6" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-6 w-full rounded flex items-center justify-center font-medium text-[11px] transition-colors ${
                    selected
                      ? 'bg-[#EA580C] text-white font-bold shadow-xs'
                      : today
                      ? 'border border-[#EA580C] text-[#EA580C] font-bold hover:bg-orange-50'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
