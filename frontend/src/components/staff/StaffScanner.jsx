import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQRScanner } from '../../hooks/useQRScanner';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '../../helper/Icons.jsx';
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

const StaffScanner = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [manualTicketNumber, setManualTicketNumber] = useState('');
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'

  // Define scanner callback functions first
  const onScanSuccess = (decodedText, decodedResult) => {
    processTicketScan(decodedText);
  };

  const onScanFailure = (error) => {
    // Silent failure handling
  };

  // QR Scanner hook
  const { scanner, isInitialized, error: scannerError, initialize: initScanner, cleanup: cleanupScanner } = useQRScanner(
    'qr-reader',
    onScanSuccess,
    onScanFailure
  );

  useEffect(() => {
    if (!user || user.selectedRole !== 'event_staff') {
      navigate('/staff/dashboard');
      return;
    }

    fetchEventDetails();
  }, [eventId, user]);

  // Initialize scanner when scan mode changes to camera
  useEffect(() => {
    if (scanMode === 'camera' && !loading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initScanner();
      }, 200);
      
      return () => clearTimeout(timer);
    } else if (scanMode === 'manual') {
      cleanupScanner();
    }
  }, [scanMode, loading, initScanner, cleanupScanner]);

  const fetchEventDetails = async () => {
    try {
      const response = await apiClient.get(`/api/staff/events/${eventId}/attendance`);
      setEvent(response.event);
      setLoading(false);
    } catch (error) {
      setError('Failed to load event details');
      setLoading(false);
    }
  };

  // Scanner functions are now handled by the useQRScanner hook

  const processTicketScan = async (ticketData) => {
    if (isScanning) return; // Prevent multiple scans
    
    setIsScanning(true);
    
    
    try {
      const response = await apiClient.post('/api/staff/scan-ticket', {
        ticketNumber: ticketData,
        eventId: eventId,
        action: 'entry'
      });

      const result = {
        id: Date.now(),
        ticketNumber: ticketData,
        success: true,
        message: response.message,
        attendee: response.data?.attendee,
        timestamp: new Date(),
        isFirstScan: response.data?.isFirstScan
      };

      setScanResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      toast.success(`✅ ${response.message}`);

    } catch (error) {
      
      let errorMessage = 'Scan failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const result = {
        id: Date.now(),
        ticketNumber: ticketData,
        success: false,
        message: errorMessage,
        timestamp: new Date()
      };

      setScanResults(prev => [result, ...prev.slice(0, 9)]);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setTimeout(() => setIsScanning(false), 1000); // Prevent rapid scans
    }
  };

  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualTicketNumber.trim()) return;
    
    await processTicketScan(manualTicketNumber.trim());
    setManualTicketNumber('');
  };

  const toggleScanMode = () => {
    if (scanMode === 'camera') {
      // Switch to manual mode
      cleanupScanner();
      setScanMode('manual');
    } else {
      // Switch to camera mode
      setScanMode('camera');
      // Scanner will be initialized by useEffect
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-400 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300">Loading scanner...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-3xl font-bold text-red-400 mb-4">Scanner Error</h2>
          <p className="text-gray-300 mb-8">{error}</p>
          
          <Link
            to="/staff/my-events"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold"
          >
            Back to My Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen">
      <div className="pt-24">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link 
              to="/staff/my-events"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to My Events
            </Link>
            
            <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ticket Scanner
            </h1>
            
            {event && (
              <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                <div className="flex flex-wrap justify-center gap-4 text-gray-300">
                  <span>📅 {new Date(event.startDateTime).toLocaleDateString()}</span>
                  <span>📍 {event.location?.venue || 'Venue TBD'}</span>
                  <span>👤 {event.host?.firstName} {event.host?.lastName}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scanner Section */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Scanner</h3>
                  <button
                    onClick={toggleScanMode}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {scanMode === 'camera' ? '📝 Manual Entry' : '📷 Camera Scanner'}
                  </button>
                </div>

                {scanMode === 'camera' ? (
                  <div>
                    <div className="mb-4 min-h-[300px] flex items-center justify-center bg-gray-700 rounded-lg relative">
                      <div id="qr-reader" className="w-full h-full"></div>
                      {!isInitialized && (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400">
                          <div>
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400 mx-auto mb-2"></div>
                            <p>Initializing camera scanner...</p>
                          </div>
                        </div>
                      )}
                      {scannerError && (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-red-400">
                          <div>
                            <p>Scanner Error: {scannerError}</p>
                            <button 
                              onClick={() => initScanner()}
                              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-center text-sm">
                      Point your camera at a QR code to scan tickets
                    </p>
                    {event && (
                      <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-400 text-sm text-center">
                          <strong>Event:</strong> {event.title}<br/>
                          <strong>Starts:</strong> {new Date(event.startDateTime).toLocaleString()}<br/>
                          <strong>Check-in available:</strong> Up to 2 hours before event start
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleManualScan} className="space-y-4">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2">
                          Enter Ticket Number
                        </label>
                        <input
                          type="text"
                          value={manualTicketNumber}
                          onChange={(e) => setManualTicketNumber(e.target.value)}
                          placeholder="Enter ticket number..."
                          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-400 focus:outline-none text-lg font-mono"
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!manualTicketNumber.trim() || isScanning}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isScanning ? 'Processing...' : 'Scan Ticket'}
                      </button>
                    </form>
                  </div>
                )}

                {isScanning && (
                  <div className="text-center mt-4">
                    <div className="inline-flex items-center gap-2 text-yellow-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-yellow-400"></div>
                      Processing scan...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scan Results Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6">Recent Scans</h3>
                
                {scanResults.length === 0 ? (
                  <div className="text-center py-8">
                    <QrCodeIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No scans yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {scanResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-4 rounded-lg border ${
                          result.success 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {result.success ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-400" />
                          ) : (
                            <XCircleIcon className="h-6 w-6 text-red-400" />
                          )}
                          <span className={`font-semibold ${
                            result.success ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                          {result.isFirstScan && (
                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                              First Scan
                            </span>
                          )}
                        </div>
                        
                        {result.attendee && (
                          <p className="text-white font-medium mb-1">
                            {result.attendee.name}
                          </p>
                        )}
                        
                        <p className="text-gray-300 text-sm mb-2">{result.message}</p>
                        
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="font-mono">{result.ticketNumber}</span>
                          <span>{result.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="text-center mt-12 flex flex-wrap justify-center gap-4">
            <Link
              to={`/staff/attendance/${eventId}`}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-bold"
            >
              View Full Attendance
            </Link>
            <Link
              to="/staff/my-events"
              className="bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all font-bold"
            >
              Back to Events
            </Link>
            <Link
              to="/staff/dashboard"
              className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-500 transition-all font-bold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffScanner;
