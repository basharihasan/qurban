/**
 * Socket.IO event handlers for realtime updates
 * @param {import('socket.io').Server} io
 */
const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join role-based rooms
    socket.on('join:room', ({ role, userId }) => {
      if (role) socket.join(`role:${role}`);
      if (userId) socket.join(`user:${userId}`);
      console.log(`  → Joined room: role:${role}, user:${userId}`);
    });

    // Panitia requests live animal list
    socket.on('panitia:requestAnimals', () => {
      socket.emit('panitia:animalsRequested');
    });

    // Client acknowledges notification
    socket.on('notification:ack', ({ notificationId }) => {
      console.log(`  → Notification ${notificationId} acknowledged`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { setupSocket };
