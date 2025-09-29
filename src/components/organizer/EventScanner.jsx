// src/components/organizer/EventScanner.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../../contexts/AuthContext";
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from "../../helper/Icons.jsx";
import apiClient from "../../utils/apiClient";

// --- Result Overlay Component ---
const ScanResultOverlay = ({ result, onClear }) => {
  useEffect(() => {
    if (result) {
      const timer = setTimeout(onClear, 3000);
      return () => clearTimeout(timer);
    }
  }, [result, onClear]);

  if (!result) return null;

  const resultStyles = { 
    success: { bg: "bg-green-500/80", icon: <CheckCircleIcon className="w-24 h-24 text-white" /> }, 
    warning: { bg: "bg-yellow-500/80", icon: <ExclamationCircleIcon className="w-24 h-24 text-white" /> }, 
    error: { bg: "bg-red-500/80", icon: <XCircleIcon className="w-24 h-24 text-white" /> } 
  };
  const { bg, icon } = resultStyles[result.status] || resultStyles.error;

  return (
    <div className={`fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in ${bg}`}>
      <div className="text-center text-white">
        {icon}
        <p className="text-3xl font-bold mt-4">{result.message}</p>
        {result.attendeeName && <p className="text-xl mt-2">{result.attendeeName}</p>}
      </div>
    </div>
  );
};

// --- Main Scanner Page Component ---
const EventScannerPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const scannerRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerRunning, setIsScannerRunning] = useState(false);

  const handleScanSuccess = async (qrCodeData) => {
    if (isLoading || !user) return;
    setIsLoading(true);

    try {
      const response = await apiClient.post('/api/host/tickets/verify', {
        qrCodeData, 
        eventId
      });

      setScanResult({
        status: response.success ? 'success' : 'error',
        message: response.message,
        attendeeName: response.attendee?.firstName ? `${response.attendee.firstName} ${response.attendee.lastName}` : null
      });
    } catch (error) {
      setScanResult({ 
        status: "error", 
        message: error.message || "Verification failed" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleScanner = async () => {
    if (isScannerRunning) {
      try {
        await scannerRef.current.stop();
        setIsScannerRunning(false);
      } catch (err) { 
        console.error("Failed to stop scanner", err); 
      }
    } else {
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScanSuccess,
          () => { /* Optional error callback */ }
        );
        setIsScannerRunning(true);
      } catch (err) { 
        console.error("Unable to start scanner", err); 
      }
    }
  };

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on unmount", err));
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
      <ScanResultOverlay result={scanResult} onClear={() => setScanResult(null)} />
      <div className="container mx-auto max-w-md text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">Ticket Scanner</span>
        </h1>
        <p className="text-gray-400 mb-8">Point the camera at an attendee's QR code.</p>
        <div className="w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-800 shadow-lg">
          <div id="qr-reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>
        </div>
        {isLoading && <p className="mt-4 text-cyan-400 animate-pulse">Verifying...</p>}
        <div className="mt-6">
          <button 
            onClick={handleToggleScanner} 
            className={`w-full font-bold rounded-full px-8 py-3 transition-all duration-300 ease-in-out transform hover:scale-105 ${
              isScannerRunning ? "bg-red-500 hover:bg-red-600 text-white" : "bg-cyan-500 hover:bg-cyan-600 text-black"
            }`}
          >
            {isScannerRunning ? "Stop Scanner" : "Start Scanner"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventScannerPage;