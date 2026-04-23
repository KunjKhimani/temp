// socketSetup.js
const { Server } = require("socket.io");
const { verifySocketToken } = require("./middleware/socketAuth"); // Adjust path if needed

let ioInstance = null;

const initializeSocketIO = (httpServer, clientURL) => {
  const io = new Server(httpServer, {
    cors: {
      origin: clientURL || "*", // Use clientURL, fallback to wildcard
      methods: ["GET", "POST"],
    },
  });

  // --- Socket.IO Middleware ---
  io.use(verifySocketToken);

  // --- Socket.IO Connection Handling ---
  io.on("connection", (socket) => {
    if (!socket.userId) {
      console.error(
        "[Socket.IO] User connected without userId after auth middleware. Disconnecting."
      );
      socket.disconnect(true);
      return;
    }

    console.log(
      `[Socket.IO] User connected: ${socket.id}, UserID: ${socket.userId}`
    );

    socket.join(socket.userId.toString()); // Ensure userId is a string for room name
    console.log(
      `[Socket.IO] Socket ${socket.id} joined room: ${socket.userId}`
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket.IO] User disconnected: ${socket.id}, Reason: ${reason}, UserID: ${socket.userId}`
      );
    });

    socket.on("testEvent", (data) => {
      console.log(
        `[Socket.IO] Received testEvent from ${socket.userId}:`,
        data
      );
      socket.emit("testResponse", { message: "Test received successfully!" });
    });

    // Example: Client acknowledges a notification was seen/read
    socket.on("mark_notification_read", (notificationId) => {
      console.log(
        `[Socket.IO] User ${socket.userId} marked notification ${notificationId} as read.`
      );
      // Here you would typically update the notification status in the database
      // And potentially broadcast an update if other sessions of the same user need to know.
      // For now, just log.
    });
  });

  ioInstance = io;
  return io;
};

const getIoInstance = () => {
  if (!ioInstance) {
    throw new Error(
      "Socket.IO has not been initialized. Call initializeSocketIO first."
    );
  }
  return ioInstance;
};

module.exports = { initializeSocketIO, getIoInstance };
