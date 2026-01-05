'use client';

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface CalendarEvent {
  id: string; 
  date: string;
  title: string;
  message?: string;
  startTime?: string;
  endTime?: string;
}

interface ContinuousCalendarProps {
  onClick?: (_day: number, _month: number, _year: number) => void;
  events?: CalendarEvent[];
  onAddEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  selectedDate?: Date | null;
}

export const ContinuousCalendar: React.FC<ContinuousCalendarProps> = ({ onClick, events = [], onAddEvent, onDeleteEvent, selectedDate }) => {
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [pendingScroll, setPendingScroll] = useState<{ m: number, d: number } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Track which event is being edited (if any)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [startT, setStartT] = useState('09:00');
  const [endT, setEndT] = useState('10:00');

  const monthOptions = monthNames.map((month, index) => ({ name: month, value: `${index}` }));

  // --- SCROLL LOGIC ---
  const executeScroll = (monthIndex: number, dayIndex: number) => {
    const targetDayIndex = dayRefs.current.findIndex(
      (ref) => ref && ref.getAttribute('data-month') === `${monthIndex}` && ref.getAttribute('data-day') === `${dayIndex}`,
    );
    const targetElement = dayRefs.current[targetDayIndex];
    const container = containerRef.current;

    if (targetElement && container) {
      const elementRect = targetElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
      container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' });
    }
  };

  useLayoutEffect(() => {
    if (pendingScroll) {
      executeScroll(pendingScroll.m, pendingScroll.d);
      setPendingScroll(null);
    }
  }, [pendingScroll, year]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = parseInt(event.target.value, 10);
    setSelectedMonth(monthIndex);
    setPendingScroll({ m: monthIndex, d: 1 });
  };

  const handleTodayClick = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setPendingScroll({ m: t.getMonth(), d: t.getDate() });
  };

  const handlePrevYear = () => setYear((prev) => prev - 1);
  const handleNextYear = () => setYear((prev) => prev + 1);

  // --- EVENT HANDLERS ---
  const handleEventClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation(); 
    setSelectedEventId(eventId === selectedEventId ? null : eventId); 
  };

  const handleDeleteClick = () => {
    if (selectedEventId && onDeleteEvent) {
      onDeleteEvent(selectedEventId);
      setSelectedEventId(null); 
    }
  };

  // --- EDIT HANDLER (Fixes the time format issue) ---
  const handleEditClick = () => {
    const evt = events.find(e => e.id === selectedEventId);
    if (evt && selectedDate) {
        // Pre-fill modal with event data
        setTitle(evt.title);
        setMessage(evt.message || '');
        
        // FIX: Database returns "HH:mm:ss". Input expects "HH:mm".
        // We slice the first 5 characters to ensure compatibility.
        const sTime = evt.startTime && evt.startTime.length >= 5 ? evt.startTime.slice(0, 5) : '09:00';
        const eTime = evt.endTime && evt.endTime.length >= 5 ? evt.endTime.slice(0, 5) : '10:00';
        
        setStartT(sTime);
        setEndT(eTime);
        
        setEditingEventId(evt.id); // Mark as editing
        setIsModalOpen(true);
    }
  };

  const handleOpenModal = () => { 
    if (selectedDate) {
        // Reset for new event
        setTitle(''); 
        setMessage(''); 
        setStartT('09:00'); 
        setEndT('10:00');
        setEditingEventId(null); // Ensure we are NOT in edit mode
        setIsModalOpen(true); 
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setTitle(''); setMessage(''); setStartT('09:00'); setEndT('10:00');
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddEvent && selectedDate) {
      onAddEvent({
        id: editingEventId || Date.now().toString(), // Use existing ID if editing
        date: selectedDate.toLocaleDateString('en-CA'),
        title, 
        message, 
        startTime: startT, 
        endTime: endT
      });
      handleCloseModal();
    }
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    setSelectedEventId(null); 
    if (!onClick) return;
    onClick(day, month < 0 ? 11 : month, month < 0 ? year - 1 : year);
  }

  const getEventsForDay = (d: number, m: number, y: number) => {
    const dateStr = new Date(y, m, d).toLocaleDateString('en-CA');
    return events.filter(e => e.date === dateStr);
  };

  // --- CALENDAR RENDER ---
  const generateCalendar = useMemo(() => {
    const today = new Date();
    dayRefs.current = [];

    const daysInYear: { month: number; day: number }[] = [];
    const startDayOfWeek = new Date(year, 0, 1).getDay();

    if (startDayOfWeek < 6) {
      for (let i = 0; i < startDayOfWeek; i++) {
        daysInYear.push({ month: -1, day: 32 - startDayOfWeek + i });
      }
    }
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        daysInYear.push({ month, day });
      }
    }
    const lastWeekDayCount = daysInYear.length % 7;
    if (lastWeekDayCount > 0) {
      const extra = 7 - lastWeekDayCount;
      for (let day = 1; day <= extra; day++) {
        daysInYear.push({ month: 0, day });
      }
    }

    const calendarWeeks = [];
    for (let i = 0; i < daysInYear.length; i += 7) {
      calendarWeeks.push(daysInYear.slice(i, i + 7));
    }

    return calendarWeeks.map((week, weekIndex) => (
      <div className="flex w-full" key={`week-${weekIndex}`}>
        {week.map(({ month, day }, dayIndex) => {
          const globalIndex = weekIndex * 7 + dayIndex;
          const isNewMonth = globalIndex === 0 || daysInYear[globalIndex - 1].month !== month;
          const isToday = today.getMonth() === month && today.getDate() === day && today.getFullYear() === year;
          
          const isSelected = selectedDate && 
                             selectedDate.getDate() === day && 
                             selectedDate.getMonth() === month && 
                             selectedDate.getFullYear() === year;

          const dayEvents = getEventsForDay(day, month, year);

          return (
            <div
              key={`${month}-${day}-${globalIndex}`}
              ref={(el) => { if (el) dayRefs.current[globalIndex] = el; }}
              data-month={month}
              data-day={day}
              onClick={() => handleDayClick(day, month, year)}
              className={`
                relative z-10 -ml-px -mt-px group aspect-square flex-1 cursor-pointer rounded-xl border font-medium transition-all hover:z-20 hover:border-cyan-400 
                ${isSelected ? 'ring-2 ring-blue-600 bg-blue-50 z-30' : ''}
                sm:rounded-2xl sm:border-2 lg:rounded-3xl
              `}
            >
              <span className={`absolute left-1 top-1 flex size-5 items-center justify-center rounded-full text-xs sm:size-6 sm:text-sm lg:left-2 lg:top-2 lg:size-8 lg:text-base ${isToday ? 'bg-blue-500 font-semibold text-white' : ''} ${month < 0 ? 'text-slate-400' : 'text-slate-800'}`}>
                {day}
              </span>
              
              <div className="absolute top-8 sm:top-10 left-1 right-1 flex flex-col gap-0.5 sm:gap-1 overflow-hidden z-40 max-h-[60%]">
                {dayEvents.map((evt) => {
                   const isEvtSelected = evt.id === selectedEventId;
                   return (
                    <div 
                      key={evt.id} 
                      onClick={(e) => handleEventClick(e, evt.id)}
                      className={`
                        text-[9px] sm:text-[10px] md:text-xs px-1 py-0.5 rounded truncate border shadow-sm transition-all
                        ${isEvtSelected 
                           ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300' 
                           : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'}
                      `}
                    >
                      {evt.title}
                    </div>
                   );
                })}
              </div>

              {isNewMonth && (
                <span className="absolute bottom-0.5 left-0 w-full truncate px-1.5 text-xs font-semibold text-slate-300 sm:bottom-0 sm:text-sm lg:bottom-1.5 lg:left-2 lg:text-lg">
                  {monthNames[month]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    ));
  }, [year, events, selectedDate, selectedEventId]);

  // --- OBSERVER ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const month = parseInt(entry.target.getAttribute('data-month')!, 10);
          setSelectedMonth(month);
        }
      });
    }, { root: container, rootMargin: '-75% 0px -25% 0px', threshold: 0 });

    dayRefs.current.forEach((ref) => {
      if (ref && ref.getAttribute('data-day') === '15') observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [year]);

  return (
    <div ref={containerRef} className="relative no-scrollbar calendar-container max-h-full overflow-y-scroll rounded-t-2xl bg-white pb-10 text-slate-800 shadow-xl">
      <div className="sticky -top-px z-50 w-full rounded-t-2xl bg-white px-5 pt-7 sm:px-8 sm:pt-8">
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <Select name="month" value={`${selectedMonth}`} options={monthOptions} onChange={handleMonthChange} />
            <button onClick={handleTodayClick} type="button" className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100 lg:px-5 lg:py-2.5">
              Today
            </button>
            
            <button 
              type="button" 
              onClick={handleOpenModal}
              disabled={!selectedDate}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-center text-sm font-medium text-white sm:rounded-xl lg:px-5 lg:py-2.5 transition-all
                ${selectedDate 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-cyan-300 shadow-md' 
                  : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
            >
              + Add Event
            </button>

            {selectedEventId && (
               <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                  {/* EDIT BUTTON */}
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="flex items-center justify-center p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg sm:rounded-xl transition-all shadow-md"
                    title="Edit Selected Event"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                     </svg>
                  </button>
                  
                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex items-center justify-center p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg sm:rounded-xl transition-all shadow-md"
                    title="Delete Selected Event"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
               </div>
            )}

          </div>
          <div className="flex w-fit items-center justify-between">
            <button onClick={handlePrevYear} className="rounded-full border border-slate-300 p-1 transition-colors hover:bg-slate-100 sm:p-2">
              <svg className="size-5 text-slate-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="min-w-16 text-center text-lg font-semibold sm:min-w-20 sm:text-xl">{year}</h1>
            <button onClick={handleNextYear} className="rounded-full border border-slate-300 p-1 transition-colors hover:bg-slate-100 sm:p-2">
              <svg className="size-5 text-slate-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="grid w-full grid-cols-7 justify-between text-slate-500">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="w-full border-b border-slate-200 py-2 text-center font-semibold">
              {day}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full px-5 pt-4 sm:px-8 sm:pt-6">
        {generateCalendar}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
            <div className="border-b border-gray-100 pb-4 mb-4">
               <h2 className="text-2xl font-bold text-gray-800">
                 {editingEventId ? 'Edit Event' : 'Create Event'}
               </h2>
               <p className="text-gray-500 font-medium">
                 {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </p>
            </div>
            <form onSubmit={handleSubmitEvent}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Alert Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  placeholder="e.g. Morning Wake Up" autoFocus required />
              </div>
              <div className="flex gap-4 mb-4">
                 <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                    <input type="time" value={startT} onChange={(e) => setStartT(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" required />
                 </div>
                 <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
                    <input type="time" value={endT} onChange={(e) => setEndT(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" required />
                 </div>
              </div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Alert Message</label>
                    <span className={`text-xs font-medium ${message.length > 180 ? 'text-red-600' : 'text-gray-400'}`}>
                        {message.length}/180
                    </span>
                </div>
                <textarea 
                    value={message} 
                    maxLength={180}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 h-24"
                    placeholder="The text that will be converted to speech..." required 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                    {editingEventId ? 'Save Changes' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export interface SelectProps {
  name: string;
  value: string;
  label?: string;
  options: { 'name': string, 'value': string }[];
  onChange: (_event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export const Select = ({ name, value, label, options = [], onChange, className }: SelectProps) => (
  <div className={`relative ${className}`}>
    {label && <label htmlFor={name} className="mb-2 block font-medium text-slate-800">{label}</label>}
    <select id={name} name={name} value={value} onChange={onChange} className="cursor-pointer rounded-lg border border-gray-300 bg-white py-1.5 pl-2 pr-6 text-sm font-medium text-gray-900 hover:bg-gray-100 sm:rounded-xl sm:py-2.5 sm:pl-3 sm:pr-8" required>
      {options.map((option) => <option key={option.value} value={option.value}>{option.name}</option>)}
    </select>
    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-1 sm:pr-2">
      <svg className="size-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
      </svg>
    </span>
  </div>
);
