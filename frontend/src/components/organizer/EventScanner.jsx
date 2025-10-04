// src/components/scanner/EventScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

const EventScanner = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualTicketNumber, setManualTicketNumber] = useState('');
  const [recentScans, setRecentScans] = useState([]);

  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🎯 Fetching event for scanner:', eventId);

        // Try multiple endpoints in order of preference
        const endpoints = [
          `/api/host/events/${eventId}`,    // Host-specific (preferred)
          `/api/events/${eventId}`,         // General fallback
          `/api/attendee/events/${eventId}` // Attendee fallback
        ];

        let eventData = null;
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`🔍 Trying endpoint: ${endpoint}`);
            const response = await apiClient.get(endpoint);
            eventData = response.event || response.data || response;
            
            if (eventData) {
              console.log(`✅ Successfully fetched from: ${endpoint}`);
              break;
            }
          } catch (error) {
            console.log(`❌ Failed endpoint: ${endpoint}`, error.message);
            lastError = error;
            continue;
          }
        }

        if (!eventData) {
          throw lastError || new Error('Event not found in any endpoint');
        }

        setEvent(eventData);
        
      } catch (error) {
        console.error('❌ All endpoints failed:', error);
        setError('Event not found or access denied');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const initializeScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false
    };

    const scanner = new Html5QrcodeScanner('qr-scanner', config, false);
    html5QrcodeScannerRef.current = scanner;

    scanner.render(
      (decodedText, decodedResult) => {
        handleScanSuccess(decodedText);
        scanner.pause(true);
        setTimeout(() => {
          if (html5QrcodeScannerRef.current) {
            scanner.resume();
          }
        }, 3000);
      },
      (error) => {
        // Silent handling of scan errors
        console.log('Scan error (normal):', error);
      }
    );

    setScanning(true);
    console.log('✅ QR Scanner initialized successfully');
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanSuccess = async (ticketNumber) => {
    try {
      console.log('🎫 Scanning ticket:', ticketNumber, 'User role:', user?.selectedRole);
      setScanResult({ status: 'processing', ticketNumber });

      // FIXED: Use correct endpoint based on user role
      const scanEndpoint = user?.selectedRole === 'event_host' 
        ? '/api/host/scan-ticket'    // ✅ Host endpoint
        : '/api/staff/scan-ticket';  // Staff endpoint

      console.log(`📡 Using scan endpoint: ${scanEndpoint} for role: ${user?.selectedRole}`);

      const response = await apiClient.post(scanEndpoint, {
        eventId,
        ticketNumber: ticketNumber.trim(),
        scannedBy: user?._id
      });

      if (response.success) {
        const result = {
          status: 'success',
          ticketNumber,
          message: response.message,
          attendee: response.ticket?.attendee,
          timestamp: new Date(), // ✅ Always create new Date object
          pricePaid: response.ticket?.pricePaid
        };

        setScanResult(result);
        setRecentScans(prev => [result, ...prev.slice(0, 4)]);
        toast.success(`✅ ${response.message}`);
      } else {
        throw new Error(response.message || 'Scan failed');
      }

    } catch (error) {
      console.error('❌ Scan error:', error);
      const result = {
        status: 'error',
        ticketNumber,
        message: error.message || 'Failed to verify ticket',
        timestamp: new Date() // ✅ Always create new Date object
      };

      setScanResult(result);
      toast.error(`❌ ${result.message}`);
    }
  };

  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualTicketNumber.trim()) {
      toast.error('Please enter a ticket number');
      return;
    }

    await handleScanSuccess(manualTicketNumber.trim());
    setManualTicketNumber('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatTime = (dateObj) => {
    // ✅ FIXED: Safe time formatting
    if (!dateObj || !(dateObj instanceof Date)) return 'Unknown time';
    try {
      return dateObj.toLocaleTimeString();
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading scanner...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Scanner Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Try Again
            </button>
            <Link 
              to={user?.selectedRole === 'event_host' ? '/organizer-dashboard' : '/staff-dashboard'}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors inline-block"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to={user?.selectedRole === 'event_host' ? '/organizer-dashboard' : '/staff-dashboard'}
            className="inline-block mb-4 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">QR Code Scanner</h1>
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 inline-block mb-4">
            <p className="text-blue-400 text-sm">
              🎯 Scanning as: <span className="font-semibold capitalize">{user?.selectedRole?.replace('_', ' ')}</span>
            </p>
          </div>
          {event && (
            <div className="bg-gray-900/50 rounded-lg p-4 inline-block">
              <h2 className="text-xl font-semibold text-cyan-400">{event.title}</h2>
              <p className="text-gray-400">{formatDate(event.startDateTime)}</p>
              <div className="flex justify-center space-x-4 mt-2 text-sm">
                <span>📍 {event.location?.venue || event.location || 'Venue TBD'}</span>
                <span>👥 {event.capacity || 0} capacity</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-center">Camera Scanner</h3>
            
            <div className="text-center mb-4">
              {!scanning ? (
                <button
                  onClick={initializeScanner}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  📹 Start Camera Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  ⏹️ Stop Scanner
                </button>
              )}
            </div>

            <div 
              id="qr-scanner" 
              ref={scannerRef}
              className="w-full max-w-md mx-auto bg-gray-800 rounded-lg overflow-hidden"
            ></div>

            {/* Manual Entry */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-lg font-medium mb-4 text-center">Manual Entry</h4>
              <form onSubmit={handleManualScan} className="flex gap-2">
                <input
                  type="text"
                  value={manualTicketNumber}
                  onChange={(e) => setManualTicketNumber(e.target.value)}
                  placeholder="Enter ticket number (e.g., TCK...)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!manualTicketNumber.trim()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Scan
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ticket numbers usually start with "TCK" followed by numbers
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Current Scan Result */}
            {scanResult && (
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-xl font-semibold mb-4">Scan Result</h3>
                <div className={`p-4 rounded-lg ${
                  scanResult.status === 'success' ? 'bg-green-500/20 border border-green-500/50' :
                  scanResult.status === 'error' ? 'bg-red-500/20 border border-red-500/50' :
                  'bg-yellow-500/20 border border-yellow-500/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">
                      {scanResult.ticketNumber}
                    </span>
                    <span className={`text-sm font-medium ${
                      scanResult.status === 'success' ? 'text-green-400' :
                      scanResult.status === 'error' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {scanResult.status === 'success' ? '✅ Valid Ticket' :
                       scanResult.status === 'error' ? '❌ Invalid/Used' :
                       '⏳ Processing...'}
                    </span>
                  </div>
                  <p className="text-white font-medium mb-2">{scanResult.message}</p>
                  {scanResult.attendee && (
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <p className="text-cyan-400 font-medium">
                        👤 {scanResult.attendee.firstName} {scanResult.attendee.lastName}
                      </p>
                      <p className="text-gray-400 text-sm">{scanResult.attendee.email}</p>
                      {scanResult.pricePaid && (
                        <p className="text-green-400 text-sm">
                          💰 Paid: {formatCurrency(scanResult.pricePaid)}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    🕒 {formatTime(scanResult.timestamp)}
                  </p>
                </div>
              </div>
            )}

            {/* Recent Scans */}
            {recentScans.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-xl font-semibold mb-4">Recent Scans</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentScans.map((scan, index) => (
                    <div key={`scan-${index}-${scan.ticketNumber}`} className={`p-3 rounded-lg ${
                      scan.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm">{scan.ticketNumber}</span>
                        <span className={scan.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                          {scan.status === 'success' ? '✅' : '❌'}
                        </span>
                      </div>
                      {scan.attendee && (
                        <p className="text-sm text-gray-300">
                          {scan.attendee.firstName} {scan.attendee.lastName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatTime(scan.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scanner Instructions */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">How to Scan</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">📱</span>
                  Point camera at QR code on ticket
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">💡</span>
                  Ensure good lighting and steady hands
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">⌨️</span>
                  Use manual entry if camera fails
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✅</span>
                  Green = Valid ticket
                </li>
                <li className="flex items-center">
                  <span className="text-red-400 mr-2">❌</span>
                  Red = Invalid/Already used
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventScanner;
