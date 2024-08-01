/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import ReactHowler from 'react-howler';
import { FaPlay, FaPause } from 'react-icons/fa';

const RadioPlayer = () => {
  const [playing, setPlaying] = useState(false); // Inicialmente no se reproduce
  const [currentSong, setCurrentSong] = useState({
    title: 'Loading...',
    image: '/losaimg.jpeg',
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const fetchCurrentSong = async () => {
      try {
        const response = await fetch(
          'https://cast5.asurahosting.com/rpc/losarad2/streaminfo.get'
        );
        const data = await response.json();
        const trackData = data.data[0].track;

        setCurrentSong({
          title: `${trackData.artist} - ${trackData.title}`,
          image: '/losaimg.jpeg',
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
    const beforeInstallPromptHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
      window.removeEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });
    };
  }, []);

  useEffect(() => {
    // Automatically play the music after 3 seconds
    const timer = setTimeout(() => {
      setPlaying(true);
    }, 3000);

    return () => clearTimeout(timer);
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

  // Function to handle background notifications
  const sendNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Radio Player', {
        body: 'You are listening to LOSA Radio!',
        icon: '/losaimg.jpeg'
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white relative">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/bglosa.png)' }}></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <img
          src={currentSong.image}
          alt="Current song"
          className="w-48 h-48 rounded-full mb-4"
        />
        <h1 className="text-2xl mb-2">LOSA Radio - La más completa</h1>
        <h2 className="text-xl mb-4">{currentSong.title}</h2>
        <ReactHowler
          src="https://cast5.asurahosting.com/proxy/losarad2/stream"
          playing={playing}
          html5={true}
          onLoad={() => console.log('Stream loaded successfully')}
          onPlay={() => console.log('Stream playing')}
          onPause={() => console.log('Stream paused')}
          onEnd={() => console.log('Stream ended')}
          onError={(error) => console.error('Stream error:', error)}
        />
        <button
          className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center"
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <FaPause className="text-white text-2xl" /> : <FaPlay className="text-white text-2xl" />}
        </button>
        {!isInstalled && (
          <button
            className="bg-green-500 px-4 py-2 rounded mt-4"
            onClick={handleInstallClick}
          >
            Install App
          </button>
        )}
      </div>
    </div>
  );
};

export default RadioPlayer;
