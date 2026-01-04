import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ContinuousCalendar, CalendarEvent } from './ContinuousCalendar';
import { supabase } from './supabaseClient';
import { SettingsModal } from './SettingsModal';

// --- YOUR DIGITALOCEAN FUNCTION URL (WEB ENDPOINT) ---
const SCHEDULER_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/scheduler-generator";

// --- ICONS ---
const GearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={spinning ? "animate-spin" : ""}
  >
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

interface DashboardProps {
  session: any;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  const [text, setText] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- STYLES ---
  const buttonBaseClass = "w-full py-3 text-base font-bold text-white rounded-lg shadow-sm transition-all active:scale-95";
  const buttonLoadingClass = "bg-gray-400 cursor-not-allowed";
  const buttonActiveClass = "bg-blue-600 hover:bg-blue-700";
  const finalButtonClass = `${buttonBaseClass} ${loading ? buttonLoadingClass : buttonActiveClass}`;

  const textAreaClass = "w-full h-[150px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 text-sm";
  const datePickerClass = "w-full p-2 border border-gray-300 rounded-lg text-center font-mono cursor-pointer hover:bg-gray-50 text-sm";

  // --- FETCH EVENTS ---
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*');
      
      if (data) {
        const loadedEvents: CalendarEvent[] = data.map((item: any) => ({
          id: item.id,
          date: item.date,
          title: item.title,
          message: item.message,
          startTime: item.start_time,
          endTime: item.end_time
        }));
        setEvents(loadedEvents);
      } else if (error) {
        console.error('Error loading events:', error);
      }
    };

    if (session) fetchEvents();
  }, [session]);

  // --- HELPER: CHECK EVENT LIMIT ---
  const checkLimit = async (checkDate: Date) => {
    const dateStr = checkDate.toLocaleDateString('en-CA');
    const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr);
    
    if (count !== null && count >= 3) {
        alert("Daily Limit Reached: You can only have 3 events per day.");
        return false;
    }
    return true;
  };

  // --- FORCE REFRESH (Call Backend) ---
  const handleForceRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    
    try {
        const response = await fetch(SCHEDULER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: session.user.id }) 
        });

        if (response.ok) {
            setMsg("System refreshed! Audio updated.");
        } else {
            setError("Refresh failed. Server error.");
        }
    } catch (err) {
        console.error(err);
        setError("Network error connecting to scheduler.");
    } finally {
        setRefreshing(false);
        setTimeout(() => { setMsg(''); setError(''); }, 4000);
    }
  };

  const handleManualConvert = async () => {
    if (!text.trim()) { alert("Please enter text."); return; }
    const canAdd = await checkLimit(date);
    if (!canAdd) return;

    setLoading(true);
    setError('');

    const { data, error } = await supabase.from('events').insert([{
        title: "Manual Alert",
        message: text,
        date: date.toLocaleDateString('en-CA'),
        start_time: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        end_time: endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        processed: false,
        user_id: session.user.id
    }]).select();

    setLoading(false);

    if (data) {
        const manualEvent: CalendarEvent = {
            id: data[0].id,
            date: date.toLocaleDateString('en-CA'),
            title: "Manual Alert",
            message: text,
            startTime: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            endTime: endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setEvents([...events, manualEvent]);
        setMsg("Event saved! Audio queued.");
        setTimeout(() => setMsg(''), 4000);
    } else if (error) {
        setError("Failed to save event: " + error.message);
    }
  };

  const handleModalEvent = async (newEvent: CalendarEvent) => {
    const eventDate = new Date(newEvent.date + 'T00:00:00'); 
    const canAdd = await checkLimit(eventDate);
    if (!canAdd) return;

    const { data, error } = await supabase.from('events').insert([{
        title: newEvent.title,
        message: newEvent.message,
        date: newEvent.date,
        start_time: newEvent.startTime,
        end_time: newEvent.endTime,
        processed: false,
        user_id: session.user.id
    }]).select();

    if (data) {
        const savedEvent = { ...newEvent, id: data[0].id };
        setEvents([...events, savedEvent]);
    } else if (error) {
        alert("Error saving event: " + error.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) console.error("Failed to delete", error);
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day);
    setDate(newDate);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 flex-none w-full flex justify-between items-center px-4 md:px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div>
