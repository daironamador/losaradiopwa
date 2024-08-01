// PWAInstallButton.js

import React, { useEffect, useRef } from 'react';

export const PWAInstallButton = () => {
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const handlePrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      deferredPrompt.current = e;
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const installPWA = () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.current.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem("pwa-is-installed", 'true');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={installPWA}
      className="bg-green-500 px-4 py-2 rounded mt-4 z-10 fixed bottom-4 left-1/2 transform -translate-x-1/2"
    >
      Instalar aplicación
    </button>
  );
};
