import React, { useRef, useEffect, useState } from 'react';
import { useWebRTC } from './useWebRTC';
import './index.css';

const VideoPlayer = ({ stream, isOff }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`video-container ${isOff ? 'off' : ''}`}>
      {stream ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="video-element"
        />
      ) : (
        <div className="placeholder">
          <div className="pulse-circle"></div>
          <p>Camera Offline</p>
        </div>
      )}
    </div>
  );
};

function App() {
  const { 
    streams, 
    toggleCamera, 
    micState, 
    toggleClientMic, 
    speakerState, 
    toggleSpeaker 
  } = useWebRTC();

  const [cam1State, setCam1State] = useState(false);
  const [cam2State, setCam2State] = useState(false);

  const handleToggleCam1 = () => {
    const newState = !cam1State;
    setCam1State(newState);
    toggleCamera('cam1', newState);
  };

  const handleToggleCam2 = () => {
    const newState = !cam2State;
    setCam2State(newState);
    toggleCamera('cam2', newState);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo-container">
          <img src="/cat-favicon.png" alt="Berry Logo" className="header-logo" />
          <h1>Berry's Home Cams</h1>
        </div>
        <p className="subtitle">Real-time surveillance & two-way audio</p>
      </header>
      
      <main className="main-content">
        <div className="cameras-grid">
          {/* Camera 1 */}
          <div className="camera-card">
            <div className="card-header">
              <h2>Camera 1</h2>
              <button 
                className={`power-btn ${cam1State ? 'on' : 'off'}`} 
                onClick={handleToggleCam1}
              >
                {cam1State ? 'ON' : 'OFF'}
              </button>
            </div>
            <VideoPlayer stream={streams.cam1} isOff={!cam1State} />
            <div className="status-indicator">
              <span className={`dot ${cam1State ? 'active' : ''}`}></span>
              {cam1State ? 'Live' : 'Standby'}
            </div>
          </div>

          {/* Camera 2 */}
          <div className="camera-card">
            <div className="card-header">
              <h2>Camera 2</h2>
              <button 
                className={`power-btn ${cam2State ? 'on' : 'off'}`} 
                onClick={handleToggleCam2}
              >
                {cam2State ? 'ON' : 'OFF'}
              </button>
            </div>
            <VideoPlayer stream={streams.cam2} isOff={!cam2State} />
            <div className="status-indicator">
              <span className={`dot ${cam2State ? 'active' : ''}`}></span>
              {cam2State ? 'Live' : 'Standby'}
            </div>
          </div>
        </div>

        <div className="global-controls">
          <div className="control-group">
            <h3>Web Microphone</h3>
            <p>Speak to Ubuntu Speaker</p>
            <button 
              className={`control-btn mic-btn ${micState ? 'active' : ''}`}
              onClick={() => toggleClientMic(!micState)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
              <span>{micState ? 'Mic ON' : 'Mic OFF'}</span>
            </button>
          </div>

          <div className="control-group">
            <h3>Ubuntu Speaker</h3>
            <p>Allow playing your voice</p>
            <button 
              className={`control-btn speaker-btn ${speakerState ? 'active' : ''}`}
              onClick={() => toggleSpeaker(!speakerState)}
            >
              {speakerState ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              )}
              <span>{speakerState ? 'Speaker ON' : 'Speaker OFF'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
