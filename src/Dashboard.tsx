import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ContinuousCalendar, CalendarEvent } from './ContinuousCalendar';
import { supabase } from './supabaseClient';
import { SettingsModal } from './SettingsModal'; // Import the new modal

// Icon for Settings (Gear)
const GearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
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
  
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const API_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/convert"; 

  // --- STYLES ---
  const buttonBaseClass = "w-full py-4 text-lg font-bold text-white rounded-xl shadow-md transition-all active:scale-95";
  const buttonLoadingClass = "bg-gray-400 cursor-not-allowed";
  const buttonActiveClass = "bg-blue-600 hover:bg-blue-700 hover:shadow-xl";
  const finalButtonClass = `${buttonBaseClass} ${loading ? buttonLoadingClass : buttonActiveClass}`;

  const textAreaClass = "w-full h-[200px] xl:h-[300px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 text-base";
  const datePickerClass = "w-full p-2 border border-gray-300 rounded-lg text-center font-mono cursor-pointer hover:bg-gray-50";

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

  const sendToBackend = async (messageText: string, startUnix: number, endUnix: number) => {
    setLoading(true);
    setAudioUrl('');
    setError('');

    try {
      if (endUnix <= startUnix) throw new Error("End time must be after Start time.");

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: messageText,
          alertStart: startUnix,
          alertEnd: endUnix
        })
      });

      const data = await response.json();

      if (data.url) {
        setAudioUrl(data.url);
        return true;
      } else if (data.error) {
        setError(data.error);
        return false;
      } else {
        setError("Unknown error from server.");
        return false;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the server.");
      return false;
    } finally {
      setLoading(false);
    }
  };

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

  const handleManualConvert = async () => {
    if (!text.trim()) { alert("Please enter text."); return; }
    
    // Check limit before proceeding
    const canAdd = await checkLimit(date);
    if (!canAdd) return;

    const getUnix = (d: Date, t: Date) => {
      const combined = new Date(d);
      combined.setHours(t.getHours());
      combined.setMinutes(t.getMinutes());
      combined.setSeconds(0);
      return Math.floor(combined.getTime() / 1000);
    };
    const start = getUnix(date, startTime);
    const end = getUnix(date, endTime);
    
    const { data, error } = await supabase.from('events').insert([{
        title: "Manual Alert",
        message: text,
        date: date.toLocaleDateString('en-CA'),
        start_time: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        end_time: endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]).select();

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
        await sendToBackend(text, start, end);
    } else if (error) {
        setError("Failed to save event: " + error.message);
    }
  };

  const handleModalEvent = async (newEvent: CalendarEvent) => {
    // Check limit
    const eventDate = new Date(newEvent.date + 'T00:00:00'); // simple parse
    const canAdd = await checkLimit(eventDate);
    if (!canAdd) return;

    const { data, error } = await supabase.from('events').insert([{
        title: newEvent.title,
        message: newEvent.message,
        date: newEvent.date,
        start_time: newEvent.startTime,
        end_time: newEvent.endTime
    }]).select();

    if (data) {
        const savedEvent = { ...newEvent, id: data[0].id };
        setEvents([...events, savedEvent]);

        const sTime = newEvent.startTime || '09:00';
        const eTime = newEvent.endTime || '10:00';
        const startDateTime = new Date(`${newEvent.date}T${sTime}`);
        const endDateTime = new Date(`${newEvent.date}T${eTime}`);
        const startUnix = Math.floor(startDateTime.getTime() / 1000);
        const endUnix = Math.floor(endDateTime.getTime() / 1000);
        
        if (newEvent.message) {
          await sendToBackend(newEvent.message, startUnix, endUnix);
        }
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
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden font-sans">
      <div className="flex-none w-full flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Text to Speech Alert System</h1>
          <p className="text-gray-500 text-sm">Powered by Azure & DigitalOcean</p>
        </div>
        
        <div className="flex items-center gap-4">
            {audioUrl && (
                <div className="flex items-center gap-4 bg-green-50 p-2 pr-4 rounded-xl border border-green-200 shadow-sm animate-in fade-in">
                <span className="text-green-700 font-bold px-2">✓ Ready!</span>
                <audio controls src={audioUrl} className="h-8 w-48 lg:w-64" />
                <a href={audioUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">Download</a>
                </div>
            )}
            
            {/* NEW: Settings Button */}
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-500 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                title="Settings"
            >
                <GearIcon />
            </button>

            <button 
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
            >
                Log Out
            </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col xl:flex-row gap-6 p-6 overflow-hidden">
        
        <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <label className="font-bold mb-3 block text-gray-700">1. Manual Message</label>
            <textarea 
              placeholder="Type your alert message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={textAreaClass}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <label className="font-bold mb-4 block text-gray-700">Manual Time</label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 uppercase mb-1">Start Time</span>
                  <DatePicker
                    selected={startTime}
                    onChange={(d: Date | null) => d && setStartTime(d)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className={datePickerClass}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 uppercase mb-1">End Time</span>
                  <DatePicker
                    selected={endTime}
                    onChange={(d: Date | null) => d && setEndTime(d)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className={datePickerClass}
                  />
                </div>
              </div>
          </div>

          <button 
            onClick={handleManualConvert} 
            disabled={loading}
            className={finalButtonClass}
          >
            {loading ? 'Processing...' : 'Create Manual Alert'}
          </button>
          
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center border border-red-200 text-sm">{error}</div>}
        </div>

        <div className="flex-grow h-full flex flex-col min-w-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
              <div className="flex-none px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <label className="font-bold text-lg text-gray-800">2. Select Date</label>
                <span className="bg-blue-600 text-white py-1 px-4 rounded-full text-sm font-bold shadow-sm">
                  {date.toDateString()}
                </span>
              </div>
              
              <div className="flex-grow relative h-full bg-white overflow-hidden">
                <ContinuousCalendar 
                    onClick={handleDateSelect} 
                    events={events}             
                    onAddEvent={handleModalEvent}
                    onDeleteEvent={handleDeleteEvent}
                    selectedDate={date}         
                />
              </div>
          </div>
        </div>

      </div>

      {/* Render Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        session={session} 
      />

    </div>
  );
};
