import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let newSocket = null;

    // Get token with multiple fallbacks
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token');

    console.log('Socket connection attempt:', {
      hasUser: !!user,
      hasToken: !!token,
      isAuthenticated,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000'
    });

    // Only connect if authenticated with valid user and token
    if (isAuthenticated && token && user && (user.id || user._id)) {
      try {
        // Clean the token - remove 'Bearer ' if it exists
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        
        const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        newSocket = io(serverUrl, {
          auth: { 
            token: cleanToken,
            userId: user.id || user._id,
            userRole: user.selectedRole || 'event_attendee'
          },
          transports: ['websocket', 'polling'], // Try websocket first
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          maxReconnectionAttempts: 5,
          forceNew: false,
          upgrade: true,
          rememberUpgrade: true,
          autoConnect: true
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('✅ Socket connected successfully:', newSocket.id);
          setIsConnected(true);
          setConnectionError(null);
          
          // Only show toast if this is the first connection or reconnection
          if (!isConnected) {
            toast.success('🔗 Connected to real-time updates', { 
              duration: 2000,
              position: 'bottom-right'
            });
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ Socket disconnected:', reason);
          setIsConnected(false);
          
          // Auto-reconnect for certain disconnection reasons
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            setTimeout(() => {
              if (newSocket && !newSocket.connected) {
                newSocket.connect();
              }
            }, 1000);
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('🚫 Socket connection error:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type,
            data: error.data
          });
          
          setConnectionError(error.message);
          setIsConnected(false);
          
          // Handle specific authentication errors
          if (error.message.includes('Authentication') || 
              error.message.includes('Unauthorized') ||
              error.message.includes('Invalid token') ||
              error.message.includes('jwt')) {
            console.warn('🔒 Auth token may be invalid for socket connection');
            // Don't show error toast for auth issues to avoid spam
          } else if (error.message.includes('timeout')) {
            console.warn('⏱️ Socket connection timeout');
          } else {
            console.warn('🔌 Socket connection failed:', error.message);
          }
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          setConnectionError(null);
          toast.success('🔗 Reconnected to real-time updates', {
            duration: 2000,
            position: 'bottom-right'
          });
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('🔄❌ Socket reconnection error:', error.message);
          setConnectionError(error.message);
        });

        newSocket.on('reconnect_failed', () => {
          console.error('🔄❌ Socket reconnection failed completely');
          setConnectionError('Failed to reconnect to server');
          toast.error('❌ Lost connection to real-time updates', {
            duration: 5000,
            position: 'bottom-right'
          });
        });

        // Event listeners for real-time updates
        newSocket.on('ticket_booked', (data) => {
          console.log('🎫 Ticket booked event received:', data);
          
          const notification = {
            id: Date.now() + Math.random(),
            type: 'success',
            message: `New ticket booked for ${data.eventTitle || 'event'}!`,
            data,
            timestamp: new Date().toISOString()
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          // Only show toast for other users' bookings, not your own
          if (data.userId !== (user.id || user._id)) {
            toast.success(notification.message, { 
              duration: 3000,
              position: 'bottom-right'
            });
          }
        });

        newSocket.on('event_updated', (data) => {
          console.log('📝 Event updated event received:', data);
          
          const notification = {
            id: Date.now() + Math.random(),
            type: 'info', 
            message: `Event "${data.eventTitle || 'Unknown'}" updated!`,
            data,
            timestamp: new Date().toISOString()
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          toast.info(notification.message, {
            duration: 3000,
            position: 'bottom-right'
          });
        });

        newSocket.on('attendee_checked_in', (data) => {
          console.log('✅ Attendee checked in event received:', data);
          
          const notification = {
            id: Date.now() + Math.random(),
            type: 'success',
            message: `${data.attendeeName || 'Someone'} checked in to ${data.eventTitle || 'event'}!`,
            data,
            timestamp: new Date().toISOString()
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          // Only show for hosts/staff, not attendees
          if (user.selectedRole === 'event_host' || user.selectedRole === 'staff') {
            toast.success(notification.message, {
              duration: 3000,
              position: 'bottom-right'
            });
          }
        });

        // Set up socket
        setSocket(newSocket);

        // Test connection health after setup
        setTimeout(() => {
          if (newSocket && !newSocket.connected) {
            console.warn('⚠️ Socket not connected after 5 seconds, connection may have failed silently');
          }
        }, 5000);

      } catch (error) {
        console.error('❌ Error creating socket connection:', error);
        setConnectionError(error.message);
        setSocket(null);
        setIsConnected(false);
      }
    } else {
      console.log('⚠️ Skipping socket connection:', {
        reason: !isAuthenticated ? 'Not authenticated' : 
                !token ? 'No token' :
                !user ? 'No user' :
                !(user.id || user._id) ? 'No user ID' : 'Unknown'
      });
      
      // Clean up existing socket if conditions are no longer met
      if (socket) {
        console.log('🧹 Cleaning up existing socket due to auth change');
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionError(null);
      }
    }

    // Cleanup function
    return () => {
      if (newSocket) {
        console.log('🧹 Cleaning up socket connection');
        newSocket.removeAllListeners();
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user?.id, user?._id, user?.selectedRole]); // Depend on auth state changes

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const reconnect = () => {
    if (socket && !socket.connected) {
      console.log('🔄 Manual reconnection attempt...');
      socket.connect();
    } else if (!socket && isAuthenticated && user) {
      console.log('🔄 Creating new socket connection...');
      // Trigger useEffect to recreate socket
      window.location.reload();
    }
  };

  // Debug method to check connection status
  const getConnectionStatus = () => ({
    isConnected,
    connectionError,
    socketId: socket?.id,
    hasSocket: !!socket,
    hasUser: !!user,
    hasUserId: !!(user?.id || user?._id),
    hasToken: !!(localStorage.getItem('token') || sessionStorage.getItem('token')),
    transportType: socket?.io?.engine?.transport?.name,
    isAuthenticated,
    userRole: user?.selectedRole
  });

  const value = {
    socket,
    notifications,
    setNotifications,
    isConnected,
    connectionError,
    removeNotification,
    clearAllNotifications,
    reconnect,
    getConnectionStatus // For debugging
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
