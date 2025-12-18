import React, { useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// We import the component, but we will define the interface locally to avoid type conflicts during the build
import { ContinuousCalendar, CalendarEvent } from './ContinuousCalendar';
import './App.css'; 

function App() {
  const [text, setText] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  
  // State for events
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const API_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/convert"; 

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

  const handleManualConvert = async () => {
    if (!text.trim()) {
      alert("Please enter some text first.");
      return;
    }
    const getUnix = (d: Date, t: Date) => {
      const combined = new Date(d);
      combined.setHours(t.getHours());
      combined.setMinutes(t.getMinutes());
      combined.setSeconds(0);
      return Math.floor(combined.getTime() / 1000);
    };
    const start = getUnix(date, startTime);
    const end = getUnix(date, endTime);
    
    // We create a visual event for the manual entry too!
    const manualEvent: CalendarEvent = {
        id: Date.now().toString(),
        date: date.toLocaleDateString('en-CA'),
        title: "Manual Alert",
        message: text,
        startTime: startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        endTime: endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setEvents([...events, manualEvent]);
    await sendToBackend(text, start, end);
  };

  const handleModalEvent = async (newEvent: CalendarEvent) => {
    setEvents([...events, newEvent]);
    
    // Safety check for optional time fields
    const sTime = newEvent.startTime || '09:00';
    const eTime = newEvent.endTime || '10:00';

    const startDateTime = new Date(`${newEvent.date}T${sTime}`);
    const endDateTime = new Date(`${newEvent.date}T${eTime}`);
    
    const startUnix = Math.floor(startDateTime.getTime() / 1000);
    const endUnix = Math.floor(endDateTime.getTime() / 1000);
    
    if (newEvent.message) {
      await sendToBackend(newEvent.message, startUnix, endUnix);
    }
  };

  // Handle Delete
  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
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
        {audioUrl && (
            <div className="flex items-center gap-4 bg-green-50 p-2 pr-4 rounded-xl border border-green-200 shadow-sm animate-in fade-in">
              <span className="text-green-700 font-bold px-2">✓ Ready!</span>
              <audio controls src={audioUrl} className="h-8 w-48 lg:w-64" />
              <a href={audioUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">Download</a>
            </div>
        )}
      </div>

      <div className="flex-grow flex flex-col xl:flex-row gap-6 p-6 overflow-hidden">
        
        <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <label className="font-bold mb-3 block text-gray-700">1. Manual Message</label>
            <textarea 
              placeholder="Type your alert message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-[200px] xl:h-[300px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 text-base"
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
                    className="w-full p-2 border border-gray-300 rounded-lg text-center font-mono cursor-pointer hover:bg-gray-50"
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
                    className="w-full p-2 border border-gray-300 rounded-lg text-center font-mono cursor-pointer hover:bg-gray-50"
                  />
                </div>
              </div>
          </div>

          <button 
            onClick={handleManualConvert} 
            disabled={loading}
            className={`w-full py-4 text-lg font-bold text-white rounded-xl shadow-md transition-all active:scale-95 ${
              loading ? 'bg-gray-400 cursor-
