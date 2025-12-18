import React, { useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ContinuousCalendar } from './ContinuousCalendar';
import './App.css'; 

function App() {
  const [text, setText] = useState<string>('');
  
  // State variables
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());

  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const API_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/convert"; 

  // Helper: Combine Date + Time
  const getUnixTimestamp = (selectedDate: Date, selectedTime: Date) => {
    if (!selectedDate || !selectedTime) return 0;
    
    const combined = new Date(selectedDate);
    combined.setHours(selectedTime.getHours());
    combined.setMinutes(selectedTime.getMinutes());
    combined.setSeconds(0);

    return Math.floor(combined.getTime() / 1000);
  };

  // Handler for the new Calendar Component
  const handleDateSelect = (day: number, month: number, year: number) => {
    // Create new date object from the calendar click (Month is 0-indexed)
    const newDate = new Date(year, month, day);
    setDate(newDate);
  };

  const handleConvert = async () => {
    if (!text.trim()) {
      alert("Please enter some text first.");
      return;
    }

    setLoading(true);
    setAudioUrl('');
    setError('');

    try {
      const alertStart = getUnixTimestamp(date, startTime);
      const alertEnd = getUnixTimestamp(date, endTime);

      if (alertEnd <= alertStart) {
        throw new Error("End time must be after Start time.");
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          alertStart: alertStart,
          alertEnd: alertEnd
        })
      });

      const data = await response.json();

      if (data.url) {
        setAudioUrl(data.url);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Unknown error from server.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-2">Text to Speech</h1>
        <p className="text-gray-600 mb-8">Powered by Azure & DigitalOcean</p>

        {/* MAIN LAYOUT: Flexbox for Side-by-Side */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          
          {/* LEFT COLUMN: Text Input */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <label className="font-bold mb-2 text-left">Message:</label>
            <textarea 
              placeholder="Type text here to convert to audio..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              style={{ height: '500px' }} 
            />
          </div>

          {/* RIGHT COLUMN: Calendar & Time */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            
            {/* 1. The Continuous Calendar */}
            <div className="w-full">
               <label className="font-bold mb-2 block text-left">
                 Selected Date: {date.toDateString()}
               </label>
               {/* We give the calendar a fixed height wrapper so it scrolls internally */}
               <div className="h-[400px] border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
                  <ContinuousCalendar onClick={handleDateSelect} />
               </div>
            </div>

            {/* 2. Time Pickers (Using React-DatePicker for specific time selection) */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="font-bold mb-1 block text-sm">Start Time:</label>
                <DatePicker
                  selected={startTime}
                  onChange={(d: Date) => setStartTime(d)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="w-full p-2 border border-gray-300 rounded-lg text-center cursor-pointer"
                />
              </div>

              <div className="flex-1">
                <label className="font-bold mb-1 block text-sm">End Time:</label>
                <DatePicker
                  selected={endTime}
                  onChange={(d: Date) => setEndTime(d)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="w-full p-2 border border-gray-300 rounded-lg text-center cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Action Button */}
            <button 
              onClick={handleConvert} 
              disabled={loading}
              className={`w-full py-4 text-lg font-bold text-white rounded-xl shadow-md transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {loading ? 'Processing...' : 'Create Alert'}
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            Error: {error}
          </div>
        )}

        {/* AUDIO PLAYER RESULT */}
        {audioUrl && (
          <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
            <h3 className="text-xl font-bold mb-4">Audio Ready:</h3>
            <audio controls autoPlay src={audioUrl} className="w-full mb-4">
              Your browser does not support audio.
            </audio>
            <a 
              href={audioUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-block px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition-colors"
            >
              Download MP3 File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
