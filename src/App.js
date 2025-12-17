import React, { useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './App.css';

function App() {
  const [text, setText] = useState('');
  
  // Initialize with current date/time objects for react-datepicker
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/convert"; 

  // Updated Helper: Combine Date object and Time object
  const getUnixTimestamp = (selectedDate, selectedTime) => {
    if (!selectedDate || !selectedTime) return 0;
    
    const combined = new Date(selectedDate);
    combined.setHours(selectedTime.getHours());
    combined.setMinutes(selectedTime.getMinutes());
    combined.setSeconds(0);

    return Math.floor(combined.getTime() / 1000);
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
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Styles for the side-by-side layout
  const layoutStyle = {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap' // Allows wrapping on very small mobile screens
  };

  const leftColumnStyle = {
    flex: 2, // Takes up twice as much space as the right column
    minWidth: '300px'
  };

  const rightColumnStyle = {
    flex: 1, // Takes up remaining space
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    textAlign: 'left'
  };

  const labelStyle = {
    fontWeight: 'bold',
    marginBottom: '5px',
    display: 'block',
    fontSize: '14px'
  };

  return (
    <div className="App">
      <div className="container" style={{ maxWidth: '900px' }}> {/* Increased max-width for side-by-side */}
        <h1>Text to Speech</h1>
        <p>Powered by Azure & DigitalOcean</p>

        {/* SIDE BY SIDE CONTAINER */}
        <div style={layoutStyle}>
          
          {/* LEFT: TEXT AREA */}
          <div style={leftColumnStyle}>
            <textarea 
              placeholder="Type text here to convert to audio..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ width: '100%', height: '200px', resize: 'vertical' }}
            />
          </div>

          {/* RIGHT: DATE & TIME PICKERS */}
          <div style={rightColumnStyle}>
            
            {/* Date */}
            <div>
              <label style={labelStyle}>Date:</label>
              <DatePicker 
                selected={date} 
                onChange={(d) => setDate(d)}
                dateFormat="MMMM d, yyyy"
                className="custom-input"
              />
            </div>

            {/* Start Time */}
            <div>
              <label style={labelStyle}>Start Time:</label>
              <DatePicker
                selected={startTime}
                onChange={(d) => setStartTime(d)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="custom-input"
              />
            </div>

            {/* End Time */}
            <div>
              <label style={labelStyle}>End Time:</label>
              <DatePicker
                selected={endTime}
                onChange={(d) => setEndTime(d)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="custom-input"
              />
            </div>

          </div>
        </div>

        {/* BUTTONS & RESULTS */}
        <div className="button-container">
          <button onClick={handleConvert} disabled={loading}>
            {loading ? 'Processing...' : 'Generate JSON & Audio'}
          </button>
        </div>

        {error && <div className="error-message">Error: {error}</div>}

        {audioUrl && (
          <div className="result-container">
            <h3>Audio Ready:</h3>
            <audio controls autoPlay src={audioUrl}>
              Your browser does not support audio.
            </audio>
            <br />
            <a href={audioUrl} target="_blank" rel="noreferrer" className="download-link">
              Download MP3 File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
