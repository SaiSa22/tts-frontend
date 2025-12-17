import React, { useState } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  
  // New State variables for Date and Time
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // =========================================================
  // PASTE YOUR BACKEND URL INSIDE THE QUOTES BELOW:
  // =========================================================
  const API_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/convert"; 

  // Helper function to convert Date + Time string to Unix Timestamp (Seconds)
  const getUnixTimestamp = (dateStr, timeStr) => {
    const dateTime = new Date(`${dateStr}T${timeStr}`);
    // Divide by 1000 to convert milliseconds to seconds (Unix standard)
    return Math.floor(dateTime.getTime() / 1000);
  };

  const handleConvert = async () => {
    // Basic validation
    if (!text.trim()) {
      alert("Please enter some text first.");
      return;
    }
    if (!date || !startTime || !endTime) {
      alert("Please select a date, start time, and end time.");
      return;
    }

    setLoading(true);
    setAudioUrl('');
    setError('');

    try {
      // Convert inputs to Unix Timestamps
      const alertStart = getUnixTimestamp(date, startTime);
      const alertEnd = getUnixTimestamp(date, endTime);

      // Check if End Time is before Start Time
      if (alertEnd <= alertStart) {
        throw new Error("End time must be after Start time.");
      }

      // We switch to POST to send the Text + Timestamps cleanly in the body
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  return (
    <div className="App">
      <div className="container">
        <h1>Text to Speech</h1>
        <p>Powered by Azure & DigitalOcean</p>

        <textarea 
          placeholder="Type text here to convert to audio..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="5"
        />

        {/* New Input Fields Container */}
        <div style={{ margin: '20px 0', textAlign: 'left' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Date:</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Start Time:</label>
              <input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>End Time:</label>
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          </div>
        </div>

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
