// App.js

import React, { useState, useEffect } from 'react';
import ReactHowler from 'react-howler';
import { FaPlay, FaPause } from 'react-icons/fa';
import './App.css';
import { PWAInstallButton } from './PWAInstallButton';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

const RadioPlayer = () => {
  const [playing, setPlaying] = useState(true);
  const [currentSong, setCurrentSong] = useState({
    title: "Cargando...",
    image: "https://losaradio.com/appadmin/losaimg.jpeg"
  });

  useEffect(() => {
    const fetchCurrentSong = async () => {
      try {
        const response = await fetch('https://cast5.asurahosting.com/rpc/losarad2/streaminfo.get');
        const data = await response.json();
        const trackData = data.data[0].track;
        setCurrentSong({
          title: `${trackData.artist} - ${trackData.title}`,
          image: trackData.imageurl || "https://losaradio.com/appadmin/losaimg.jpeg"
        });
      } catch (error) {
        console.error('Error fetching current song:', error);
      }
    };

    fetchCurrentSong();
    const interval = setInterval(fetchCurrentSong, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen text-white homebg">
      <div className="absolute inset-0 bg-blue-500 opacity-50"></div>
      <img src={currentSong.image} alt="Current song" className="w-48 h-48 rounded-full mb-4 z-10" />
      <h1 className="text-2xl mb-2 z-10">LOSA Radio - La más completa</h1>
      <h2 className="text-xl mb-4 z-10">{currentSong.title}</h2>
      <ReactHowler
        src='https://cast5.asurahosting.com/proxy/losarad2/stream'
        playing={playing}
        html5={true}
        onLoad={() => console.log('Stream loaded successfully')}
        onPlay={() => console.log('Stream playing')}
        onPause={() => console.log('Stream paused')}
        onEnd={() => console.log('Stream ended')}
        onError={(error) => console.error('Stream error:', error)}
      />
      <button
        className="bg-blue-500 px-4 py-2 rounded flex items-center z-10"
        onClick={() => setPlaying(!playing)}
      >
        {playing ? <FaPause /> : <FaPlay />}
        <span className="ml-2">{playing ? 'Pause' : 'Play'}</span>
      </button>
      <PWAInstallButton />
    </div>
  );
};

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <img src="https://losaradio.com/appadmin/losaimg.jpeg" alt="Station logo" className="splash-logo" />
      <h1>LOSA Radio</h1>
      <p>Versión 1.0</p>
      <div className="loader"></div>
    </div>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return loading ? <SplashScreen /> : <RadioPlayer />;
};

export default App;
