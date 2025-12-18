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

  const handleDateSelect = (day: number, month: number, year: number) => {
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
    // UPDATED: Added 'overflow-hidden' to body to prevent double scrollbars if needed
    <div className="App min-h-screen bg-gray-50 p-4 lg:p-8">
      
      {/* UPDATED: Changed max-width to 'max-w-[1600px]' to use more screen real estate */}
      <div className="container mx-auto max-w-[1600px]">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Text to Speech Alert System</h1>
            <p className="text-gray-600">Powered by Azure & DigitalOcean</p>
          </div>
          {/* Audio Player moved to top-right for easier access */}
          {audioUrl && (
             <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow border border-green-200">
                <span className="text-green-700 font-bold px-2">✓ Ready!</span>
                <audio controls src={audioUrl} className="h-8 w-64" />
                <a href={audioUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Download</a>
             </div>
          )}
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          
          {/* LEFT COLUMN: Text Input (Reduced to 25% width) */}
          <div className="w-full lg:w-1/4 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-full">
              <label className="font-bold mb-2 block text-gray-700">1. Enter Message</label>
              <textarea 
                placeholder="Type text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                style={{ height: '400px' }} 
              />
            </div>

             {/* Time Pickers moved to Left Column to save space for Calendar */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="font-bold mb-4 block text-gray-700">3. Select Time</label>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Start</span>
                    <DatePicker
                      selected={startTime}
                      onChange={(d: Date | null) => d && setStartTime(d)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="w-full p-2 border border-gray-300 rounded-lg text-center font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">End</span>
                    <DatePicker
                      selected={endTime}
                      onChange={(d: Date | null) => d && setEndTime(d)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="w-full p-2 border border-gray-300 rounded-lg text-center font-mono"
                    />
                  </div>
                </div>
            </div>

            <button 
              onClick={handleConvert} 
              disabled={loading}
              className={`w-full py-4 text-xl font-bold text-white rounded-xl shadow-md transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'Create Alert'}
            </button>
            {error && <div className="text-red-500 text-center text-sm">{error}</div>}
          </div>

          {/* RIGHT COLUMN: Calendar (Expanded to 75% width) */}
          <div className="w-full lg:w-3/4 flex flex-col">
            <div className="bg-white p-1 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <label className="font-bold text-lg text-gray-800">2. Select Date</label>
                  <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-semibold">
                    Selected: {date.toDateString()}
                  </span>
               </div>
               
               {/* HEIGHT INCREASED: h-[800px] */}
               <div className="h-[800px] relative">
                  <ContinuousCalendar onClick={handleDateSelect} />
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
