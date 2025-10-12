// frontend/src/hooks/useQRScanner.js - Custom hook for QR scanner management

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const useQRScanner = (elementId, onSuccess, onFailure) => {
  const [scanner, setScanner] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const isCleaningUp = useRef(false);

  const cleanup = useCallback(() => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    if (scannerRef.current) {
      try {
        // Get the scanner instance
        const scannerInstance = scannerRef.current;
        
        // Clear the scanner
        scannerInstance.clear().catch((err) => {
          // Silent error handling
        });

        // Clear the DOM element
        const element = document.getElementById(elementId);
        if (element) {
          element.innerHTML = '';
        }

        scannerRef.current = null;
        setScanner(null);
        setIsInitialized(false);
      } catch (err) {
        // Silent error handling
      } finally {
        isCleaningUp.current = false;
      }
    }
  }, [elementId]);

  const initialize = useCallback(() => {
    if (isCleaningUp.current) return;

    const element = document.getElementById(elementId);
      if (!element) {
        return;
      }

    try {
      // Clean up any existing scanner
      cleanup();

      // Create a unique container ID to avoid conflicts
      const containerId = `qr-scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.innerHTML = `<div id="${containerId}" style="width: 100%; height: 100%;"></div>`;

      // Create the scanner
      const html5QrcodeScanner = new Html5QrcodeScanner(
        containerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );

      // Render the scanner
      html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
          if (onSuccess) onSuccess(decodedText, decodedResult);
        },
        (error) => {
          if (onFailure) onFailure(error);
        }
      );

      scannerRef.current = html5QrcodeScanner;
      setScanner(html5QrcodeScanner);
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(err.message);
      setIsInitialized(false);
    }
  }, [elementId, onSuccess, onFailure, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    scanner,
    isInitialized,
    error,
    initialize,
    cleanup
  };
};
