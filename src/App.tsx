import React, { useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ContinuousCalendar, CalendarEvent } from './ContinuousCalendar';
import './App.css'; 

function App() {
  const [text, setText] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
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
    await sendToBackend(text, start, end);
  };

  const handleModalEvent = async (newEvent: CalendarEvent) => {
    setEvents([...events, newEvent]);
    const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime || '09:00'}`);
    const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime || '10:00'}`);
    const startUnix = Math.floor(startDateTime.getTime() / 1000);
    const endUnix = Math.floor(endDateTime.getTime() / 1000);
    if (newEvent.message) {
      await sendToBackend(newEvent.message, startUnix, endUnix);
    }
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day);
    setDate(newDate);
  };

  return (
    // ROOT CONTAINER: Locked to screen height (h-screen), no global scroll (overflow-hidden)
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden font-sans">
      
      {/* HEADER: Fixed height (flex-none) */}
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

      {/* MAIN CONTENT GRID: Grows to fill remaining space (flex-grow) */}
      <div className="flex-grow flex flex-col xl:flex-row gap-6 p-6 overflow-hidden">
        
        {/* LEFT COLUMN: Controls */}
        {/* 'overflow-y-auto' allows this specific column to scroll if content gets too tall */}
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
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
            }`}
          >
            {loading ? 'Processing...' : 'Create Manual Alert'}
          </button>
          
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center border border-red-200 text-sm">{error}</div>}
        </div>

        {/* RIGHT COLUMN: Calendar Container */}
        {/* flex-grow ensures it takes all remaining width. h-full ensures it takes full height. */}
        <div className="flex-grow h-full flex flex-col min-w-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
              
              {/* Card Header (Fixed Height) */}
              <div className="flex-none px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <label className="font-bold text-lg text-gray-800">2. Select Date</label>
                <span className="bg-blue-600 text-white py-1 px-4 rounded-full text-sm font-bold shadow-sm">
                  {date.toDateString()}
                </span>
              </div>
              
              {/* Calendar Body (Fills remaining height) */}
              {/* 'relative' allows the inner calendar absolute positioning to work if needed. 'h-full' passes the height down. */}
              <div className="flex-grow relative h-full bg-white overflow-hidden">
                <ContinuousCalendar 
                    onClick={handleDateSelect} 
                    events={events}             
                    onAddEvent={handleModalEvent} 
                    selectedDate={date}         
                />
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
