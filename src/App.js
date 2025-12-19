/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import ReactHowler from 'react-howler';
import { FaPlay, FaPause, FaDownload } from 'react-icons/fa';

const RadioPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState({
    title: 'Cargando...',
    artist: 'LOSA Radio',
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
          title: trackData.title || 'Desconocido',
          artist: trackData.artist || 'LOSA Radio',
          image: '/losaimg.jpeg', // Always use the logo as cover art for consistency or update if API provides one
        });
      } catch (error) {
        console.error('Error fetching current song:', error);
      }
    };

    fetchCurrentSong();
    const interval = setInterval(fetchCurrentSong, 3000);
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
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-110 blur-sm brightness-75 transition-all duration-1000"
        style={{ backgroundImage: 'url(/bglosa.png)' }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-0"></div>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-3xl flex flex-col items-center text-center mx-4 animate-fade-in-up">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white/90">LOSA Radio</h1>
          <p className="text-white/60 text-sm font-medium uppercase tracking-widest mt-1">La más completa</p>
        </div>

        {/* Album Art */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full group-hover:bg-pink-500/30 transition-all duration-500"></div>
          <img
            src={currentSong.image}
            alt="Album Art"
            className={`relative w-48 h-48 rounded-2xl shadow-2xl object-cover transition-transform duration-700 ${playing ? 'scale-100' : 'scale-95 grayscale-[0.2]'}`}
          />
        </div>

        {/* Song Info */}
        <div className="mb-10 w-full">
          <h2 className="text-2xl font-bold text-white mb-2 truncate drop-shadow-md">{currentSong.title}</h2>
          <p className="text-lg text-white/70 font-medium truncate">{currentSong.artist}</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col items-center">
          <ReactHowler
            src="https://cast5.asurahosting.com/proxy/losarad2/stream"
            playing={playing}
            html5={true}
          />

          <button
            className={`w-20 h-20 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-white/20 ${playing ? 'animate-pulse-slow' : ''}`}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <FaPause className="text-3xl" /> : <FaPlay className="text-3xl ml-1" />}
          </button>
        </div>

        {/* Install Button (Conditional) */}
        {!isInstalled && deferredPrompt && (
          <button
            className="group glass-button px-6 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-white/90"
            onClick={handleInstallClick}
          >
            <FaDownload className="text-pink-400 group-hover:text-pink-300 transition-colors" />
            <span>Instalar App</span>
          </button>
        )}
      </div>

      {/* Footer / Branding */}
      <div className="absolute bottom-6 text-white/30 text-xs font-light z-10">
        Streaming Powered by losaradio x Dairon Amador
      </div>
    </div>
  );
};

export default RadioPlayer;
