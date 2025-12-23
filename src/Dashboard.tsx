import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ContinuousCalendar, CalendarEvent } from './ContinuousCalendar';
import { supabase } from './supabaseClient'; // Import client

interface DashboardProps {
  session: any; // Receive session info
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  // ... (Keep existing basic state: text, date, startTime, endTime) ...
  const [text, setText] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const API_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/convert"; 

  // --- 1. FETCH EVENTS ON LOAD ---
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*');
      
      if (error) {
        console.error('Error fetching events:', error);
      } else if (data) {
        // Map DB columns (snake_case) to React props (camelCase)
        const loadedEvents: CalendarEvent[] = data.map((item: any) => ({
          id: item.id,
          date: item.date, // "YYYY-MM-DD"
          title: item.title,
          message: item.message,
          startTime: item.start_time,
          endTime: item.end_time
        }));
        setEvents(loadedEvents);
      }
    };

    if (session) fetchEvents();
  }, [session]);

  // --- 2. SEND TO AZURE HELPER (No changes) ---
  const sendToBackend = async (messageText: string, startUnix: number, endUnix: number) => {
    setLoading(true); setAudioUrl(''); setError('');
    try {
      if (endUnix <= startUnix) throw new Error("End time must be after Start time.");
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText, alertStart: startUnix, alertEnd: endUnix })
      });
      const data = await response.json();
      if (data.url) { setAudioUrl(data.url); return true; } 
      else if (data.error) { setError(data.error); return false; } 
      else { setError("Unknown error from server."); return false; }
    } catch (err: any) { setError(err.message); return false; } 
    finally { setLoading(false); }
  };

  // --- 3. HANDLE MANUAL CREATE ---
  const handleManualConvert = async () => {
    if (!text.trim()) { alert("Please enter text."); return; }
    // ... (Timestamp logic) ...
    const getUnix = (d: Date, t: Date) => {
        const combined = new Date(d);
        combined.setHours(t.getHours()); combined.setMinutes(t.getMinutes()); combined.setSeconds(0);
        return Math.floor(combined.getTime() / 1000);
    };
    const start = getUnix(date, startTime);
    const end = getUnix(date, endTime);

    // Save to DB
    const { data, error } = await supabase
      .from('events')
      .insert([{
        title: "Manual Alert",
        message: text,
        date: date.toLocaleDateString('en-CA'),
        start_time: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        end_time: endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }])
      .select();

    if (data) {
        // Add to local state (using the ID returned from DB)
        const newEvent = {
            id: data[0].id,
            title: "Manual Alert",
            message: text,
            date: date.toLocaleDateString('en-CA'),
            startTime: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            endTime: endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setEvents([...events, newEvent]);
        await sendToBackend(text, start, end);
    } else if (error) {
        alert("Error saving event: " + error.message);
    }
  };

  // --- 4. HANDLE MODAL CREATE ---
  const handleModalEvent = async (newEvent: CalendarEvent) => {
    // Save to DB
    const { data, error } = await supabase
      .from('events')
      .insert([{
        title: newEvent.title,
        message: newEvent.message,
        date: newEvent.date,
        start_time: newEvent.startTime,
        end_time: newEvent.endTime
      }])
      .select();

    if (data) {
        // Use the Real ID from database, not the temporary one
        const savedEvent = { ...newEvent, id: data[0].id };
        setEvents([...events, savedEvent]);

        // Logic for Audio Processing
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

  // --- 5. HANDLE DELETE ---
  const handleDeleteEvent = async (eventId: string) => {
    // Optimistic Update (Remove from UI immediately)
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);

    // Remove from DB
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
        
    if (error) {
        console.error('Error deleting:', error);
        // Optional: Revert state if failed
    }
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    setDate(new Date(year, month, day));
  };

  // ... (Rest of layout/JSX is exactly the same as before, no changes needed to visuals) ...
  // Be sure to replace the styles and JSX return block from your previous Dashboard.tsx here.
  // ... 
  // (JSX omitted for brevity, it is identical to previous version, just ensure variables match)
  return (
      // ... Paste your JSX here ...
      // Just ensure the logout button calls onLogout
      <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden font-sans">
        {/* ... Header ... */}
            <button onClick={onLogout} className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">Log Out</button>
        {/* ... Rest of app ... */}
            <ContinuousCalendar 
                onClick={handleDateSelect} 
                events={events}             
                onAddEvent={handleModalEvent}
                onDeleteEvent={handleDeleteEvent}
                selectedDate={date}         
            />
        {/* ... */}
      </div>
  );
};
