import React, { useState } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // =========================================================
  // PASTE YOUR BACKEND URL INSIDE THE QUOTES BELOW:
  // =========================================================
  const API_URL = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d690139c-c62c-4535-a31f-b6895767f7aa/speech/convert"; 

  const handleConvert = async () => {
    if (!text.trim()) {
      alert("Please enter some text first.");
      return;
    }

    setLoading(true);
    setAudioUrl('');
    setError('');

    try {
      // We encode the text to handle spaces and special characters safely
      const fullUrl = `${API_URL}?text=${encodeURIComponent(text)}`;
      
      const response = await fetch(fullUrl);
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
      setError("Failed to connect to the server.");
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

        <div className="button-container">
          <button onClick={handleConvert} disabled={loading}>
            {loading ? 'Converting...' : 'Convert to MP3'}
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
