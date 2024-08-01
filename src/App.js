/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import ReactHowler from 'react-howler';
import { FaPlay, FaPause } from 'react-icons/fa';

const RadioPlayer = () => {
  const [playing, setPlaying] = useState(true);
  const [currentSong, setCurrentSong] = useState({
    title: "Loading...",
    image: "https://losaradio.com/appadmin/losaimg.jpeg"
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

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

  useEffect(() => {
    // Listener for beforeinstallprompt event
    const beforeInstallPromptHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('App has been installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
        setDeferredPrompt(null);
      } else {
        console.log('User dismissed the install prompt');
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen text-white homebg">
      <div className="absolute inset-0 bg-blue-500 opacity-50"></div>
      <img src={currentSong.image} alt="Current song" className="w-48 h-48 rounded-full mb-4 z-10" />
      <h1 className="text-2xl mb-2 z-10">LOSA Radio - La más completa</h1>
      <h2 className="text-xl mb-4 z-10">{currentSong.title}</h2>
      <ReactHowler
        src='http://65.108.98.93:7528/stream'
        playing={playing}
        html5={true}
        onLoad={() => console.log('Stream loaded successfully')}
        onPlay={() => console.log('Stream playing')}
        onPause={() => console.log('Stream paused')}
        onEnd={() => console.log('Stream ended')}
        onError={(error) => console.error('Stream error:', error)}
      />
      <button
        className="bg-blue-500 px-4 py-2 rounded flex items-center z-10 mb-4"
        onClick={() => setPlaying(!playing)}
      >
        {playing ? <FaPause /> : <FaPlay />}
        <span className="ml-2">{playing ? 'Pause' : 'Play'}</span>
      </button>

      {!isInstalled && deferredPrompt && (
        <button
          className="bg-green-500 px-4 py-2 rounded z-10"
          onClick={handleInstallClick}
        >
          Instalar App
        </button>
      )}
    </div>
  );
};

export default RadioPlayer;
