const socketAuthMiddleware = require('../middleware/socketAuth');

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  initialize(server) {
    const { Server } = require('socket.io');
    
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowUpgrades: true
    });

    // Apply authentication middleware
    this.io.use(socketAuthMiddleware);

    // Handle connections
    this.io.on('connection', (socket) => {
      console.log(`✅ User ${socket.user.firstName} ${socket.user.lastName} connected:`, socket.id);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // If user is event host, join them to host room
      if (socket.user.selectedRole === 'event_host') {
        socket.join('event_hosts');
      }
      
      // If user is staff, join staff room
      if (socket.user.selectedRole === 'event_staff') {
        socket.join('event_staff');
      }

      // Handle custom events
      socket.on('join_event_room', (eventId) => {
        socket.join(`event_${eventId}`);
        console.log(`User ${socket.userId} joined event room: ${eventId}`);
      });

      socket.on('leave_event_room', (eventId) => {
        socket.leave(`event_${eventId}`);
        console.log(`User ${socket.userId} left event room: ${eventId}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`❌ User ${socket.userId} disconnected:`, reason);
        this.connectedUsers.delete(socket.userId);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to TapIn real-time service',
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    console.log('🚀 Real-time service initialized with Socket.io');
  }

  // Notify when ticket is booked
  notifyTicketBooked(eventId, hostId, ticketData) {
    if (!this.io) return;

    try {
      // Notify event host
      this.io.to(`user_${hostId}`).emit('ticket_booked', {
        eventId,
        ticketNumber: ticketData.ticketNumber,
        attendeeName: ticketData.attendeeName,
        timestamp: new Date().toISOString(),
        message: `New ticket booked: ${ticketData.ticketNumber}`
      });

      // Notify all hosts
      this.io.to('event_hosts').emit('ticket_booked', {
        eventId,
        ticketNumber: ticketData.ticketNumber,
        attendeeName: ticketData.attendeeName,
        timestamp: new Date().toISOString()
      });

      console.log(`📢 Ticket booked notification sent for event ${eventId}`);
    } catch (error) {
      console.error('❌ Error sending ticket booked notification:', error);
    }
  }

  // Notify when event is updated
  notifyEventUpdated(eventId, eventData) {
    if (!this.io) return;

    try {
      this.io.to(`event_${eventId}`).emit('event_updated', {
        eventId,
        eventTitle: eventData.title,
        changes: eventData.changes || [],
        timestamp: new Date().toISOString()
      });

      console.log(`📢 Event updated notification sent for event ${eventId}`);
    } catch (error) {
      console.error('❌ Error sending event updated notification:', error);
    }
  }

  // Send notification to specific user
  notifyUser(userId, eventType, data) {
    if (!this.io) return;

    try {
      this.io.to(`user_${userId}`).emit(eventType, {
        ...data,
        timestamp: new Date().toISOString()
      });

      console.log(`📢 Notification sent to user ${userId}:`, eventType);
    } catch (error) {
      console.error('❌ Error sending user notification:', error);
    }
  }

  // Broadcast to all connected users
  broadcast(eventType, data) {
    if (!this.io) return;

    try {
      this.io.emit(eventType, {
        ...data,
        timestamp: new Date().toISOString()
      });

      console.log(`📢 Broadcast sent:`, eventType);
    } catch (error) {
      console.error('❌ Error broadcasting:', error);
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.keys())
    };
  }
}

module.exports = new RealtimeService();
