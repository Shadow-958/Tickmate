import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [joinedRooms, setJoinedRooms] = useState(new Set());
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let newSocket = null;

    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');


    // Skip if already connected or if we don't have required data
    if (socket && isConnected) {
      return;
    }

    if (isAuthenticated && token && user && (user.id || user._id)) {
      try {
        const cleanToken = token.replace(/^Bearer\s+/i, '');

        const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        newSocket = io(serverUrl, {
          auth: {
            token: cleanToken,
            userId: user.id || user._id,
            userRole: user.selectedRole || 'event_attendee',
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          maxReconnectionAttempts: 5,
          forceNew: false,
          upgrade: true,
          rememberUpgrade: true,
          autoConnect: true,
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
          setConnectionError(null);

          const userId = user.id || user._id;
          newSocket.emit('join_user_room', userId);

          if (user.selectedRole === 'event_staff') {
            newSocket.emit('join_staff_room', userId);
          }

          if (!isConnected) {
            toast.success('🔗 Connected to real-time updates', {
              duration: 2000,
              position: 'bottom-right',
            });
          }
        });

        newSocket.on('disconnect', (reason) => {
          setIsConnected(false);
          setJoinedRooms(new Set());
          if (reason === 'io server disconnect') {
            setTimeout(() => {
              if (newSocket && !newSocket.connected) {
                newSocket.connect();
              }
            }, 1000);
          }
        });

        newSocket.on('connect_error', (error) => {
          setConnectionError(error.message);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          setIsConnected(true);
          setConnectionError(null);
          toast.success('🔗 Reconnected to real-time updates', {
            duration: 2000,
            position: 'bottom-right',
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
            position: 'bottom-right',
          });
        });

        // Event listeners for notifications
        newSocket.on('ticket_booked', (data) => {
          console.log('🎫 Ticket booked event received:', data);

          const notification = {
            id: Date.now() + Math.random(),
            type: 'success',
            message: `New ticket booked for ${data.eventTitle || 'event'}!`,
            data,
            timestamp: new Date().toISOString(),
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 49)]);

          if (data.userId !== (user.id || user._id)) {
            toast.success(notification.message, {
              duration: 3000,
              position: 'bottom-right',
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
            timestamp: new Date().toISOString(),
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 49)]);

          toast.info(notification.message, {
            duration: 3000,
            position: 'bottom-right',
          });
        });

        newSocket.on('attendee_checked_in', (data) => {
          console.log('✅ Attendee checked in event received:', data);

          const notification = {
            id: Date.now() + Math.random(),
            type: 'success',
            message: `${data.attendeeName || 'Someone'} checked in to ${data.eventTitle || 'event'}!`,
            data,
            timestamp: new Date().toISOString(),
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 49)]);

          const currentUserId = user.id || user._id;
          const shouldShowToast = (user.selectedRole === 'event_host' || user.selectedRole === 'event_staff') &&
            data.scannedBy !== currentUserId;

          if (shouldShowToast) {
            toast.success(notification.message, {
              duration: 3000,
              position: 'bottom-right',
            });
          }
        });

        newSocket.on('staff_assigned', (data) => {
          console.log('👥 Staff assigned event received:', data);

          const notification = {
            id: Date.now() + Math.random(),
            type: 'success',
            message: `You've been assigned to ${data.eventTitle}!`,
            data,
            timestamp: new Date().toISOString(),
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 49)]);

          if (data.staffId === (user.id || user._id)) {
            toast.success(notification.message, {
              duration: 4000,
              position: 'bottom-right',
            });
          }
        });

        newSocket.on('staff_removed', (data) => {
          console.log('🗑️ Staff removed event received:', data);

          const notification = {
            id: Date.now() + Math.random(),
            type: 'warning',
            message: `You've been removed from ${data.eventTitle}`,
            data,
            timestamp: new Date().toISOString(),
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 49)]);

          if (data.staffId === (user.id || user._id)) {
            toast.info(notification.message, {
              duration: 4000,
              position: 'bottom-right',
            });
          }
        });

        setSocket(newSocket);

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
          !(user.id || user._id) ? 'No user ID' : 'Unknown',
      });
      if (socket) {
        console.log('🧹 Cleaning up existing socket due to auth change');
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionError(null);
        setJoinedRooms(new Set());
      }
    }

    return () => {
      if (newSocket) {
        console.log('🧹 Cleaning up socket connection');
        newSocket.removeAllListeners();
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setJoinedRooms(new Set());
      }
    };
  }, [isAuthenticated, user?.id, user?._id, user?.selectedRole]);

  // Memoized room management functions
  const joinEventRoom = useCallback((eventId) => {
    if (socket && isConnected && eventId) {
      console.log(`🚪 Joining event room: event_${eventId}`);
      socket.emit('join_event', eventId);
      setJoinedRooms(prev => new Set(prev).add(`event_${eventId}`));
    }
  }, [socket, isConnected]);

  const leaveEventRoom = useCallback((eventId) => {
    if (socket && eventId) {
      console.log(`🚪 Leaving event room: event_${eventId}`);
      socket.emit('leave_event', eventId);
      setJoinedRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(`event_${eventId}`);
        return newSet;
      });
    }
  }, [socket]);

  const joinStaffRoom = useCallback(() => {
    if (socket && isConnected && user && (user.selectedRole === 'event_staff' || user.selectedRole === 'event_host')) {
      const userId = user.id || user._id;
      console.log(`🚪 Joining staff room for user: ${userId}`);
      socket.emit('join_staff_room', userId);
      setJoinedRooms(prev => new Set(prev).add(`staff_${userId}`));
    }
  }, [socket, isConnected, user]);

  const leaveStaffRoom = useCallback(() => {
    if (socket && user) {
      const userId = user.id || user._id;
      console.log(`🚪 Leaving staff room for user: ${userId}`);
      socket.emit('leave_staff_room', userId);
      setJoinedRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(`staff_${userId}`);
        return newSet;
      });
    }
  }, [socket, user]);

  // Notification management
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const reconnect = useCallback(() => {
    if (socket && !socket.connected) {
      console.log('🔄 Manual reconnection attempt...');
      socket.connect();
    } else if (!socket && isAuthenticated && user) {
      console.log('🔄 Creating new socket connection...');
      window.location.reload();
    }
  }, [socket, isAuthenticated, user]);

  // Better debugging method
  const getConnectionStatus = useCallback(() => ({
    isConnected,
    connectionError,
    socketId: socket?.id,
    hasSocket: !!socket,
    hasUser: !!user,
    hasUserId: !!(user?.id || user?._id),
    hasToken: !!(localStorage.getItem('token') || sessionStorage.getItem('token')),
    transportType: socket?.io?.engine?.transport?.name,
    isAuthenticated,
    userRole: user?.selectedRole,
    joinedRooms: Array.from(joinedRooms),
    notificationCount: notifications.length,
  }), [isConnected, connectionError, socket, user, isAuthenticated, joinedRooms, notifications]);

  // Helper method to emit custom events
  const emitEvent = useCallback((eventName, data) => {
    if (socket && isConnected) {
      console.log(`📤 Emitting event: ${eventName}`, data);
      socket.emit(eventName, data);
    } else {
      console.warn('⚠️ Cannot emit event - socket not connected');
    }
  }, [socket, isConnected]);

  const value = useMemo(() => ({
    socket,
    notifications,
    setNotifications,
    isConnected,
    connectionError,
    joinedRooms: Array.from(joinedRooms),

    removeNotification,
    clearAllNotifications,

    reconnect,
    getConnectionStatus,
    emitEvent,

    joinEventRoom,
    leaveEventRoom,
    joinStaffRoom,
    leaveStaffRoom,
  }), [
    socket,
    notifications,
    isConnected,
    connectionError,
    joinedRooms,
    removeNotification,
    clearAllNotifications,
    reconnect,
    getConnectionStatus,
    emitEvent,
    joinEventRoom,
    leaveEventRoom,
    joinStaffRoom,
    leaveStaffRoom,
  ]);

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

// Custom hook for event room management
export const useEventRoom = (eventId) => {
  const { joinEventRoom, leaveEventRoom, socket, isConnected } = useSocket();

  useEffect(() => {
    if (eventId && socket && isConnected) {
      joinEventRoom(eventId);

      return () => {
        leaveEventRoom(eventId);
      };
    }
  }, [eventId, socket, isConnected, joinEventRoom, leaveEventRoom]);

  return { eventId, isInRoom: socket && isConnected };
};

// Custom hook for staff room management
export const useStaffRoom = () => {
  const { joinStaffRoom, leaveStaffRoom, socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (
      user &&
      (user.selectedRole === 'event_staff' || user.selectedRole === 'event_host') &&
      socket &&
      isConnected
    ) {
      joinStaffRoom();

      return () => {
        leaveStaffRoom();
      };
    }
  }, [user?.selectedRole, socket, isConnected, joinStaffRoom, leaveStaffRoom]);

  return { isInStaffRoom: socket && isConnected };
};
