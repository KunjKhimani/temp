// middleware/socketAuth.js
const jwt = require("jsonwebtoken");
const User = require("../model/user.model"); // Adjust path as needed
const mongoose = require("mongoose"); // Import mongoose for ObjectId check

const verifySocketToken = async (socket, next) => {
  console.log("[Socket Auth] Middleware triggered.");
  console.log(
    ">>> JWT_TOKEN_KEY Value:",
    process.env.JWT_TOKEN_KEY ? "SET" : "NOT SET or EMPTY"
  );

  // 1. Get token from handshake data (standard for Socket.IO v3+)
  const token = socket.handshake.auth?.token;
  console.log(
    "[Socket Auth] Received token:",
    token ? "Token Present" : "No Token"
  );

  if (!token) {
    console.error("[Socket Auth] Authentication error: No token provided");
    // Signal error to Socket.IO connection handler
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    // 2. Verify the token
    console.log("[Socket Auth] Verifying token...");
    // Ensure JWT_TOKEN_KEY is loaded (using the key from your authMiddleware)
    if (!process.env.JWT_TOKEN_KEY) {
      console.error(
        "[Socket Auth] JWT_TOKEN_KEY environment variable is not set!"
      );
      return next(new Error("Server configuration error: Missing JWT key"));
    }
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
    console.log("[Socket Auth] Token decoded:", decoded);

    // 3. Extract User ID (using the same key as in authMiddleware)
    const userIdFromToken = decoded.user_id;

    // Validate the extracted ID
    if (!userIdFromToken) {
      console.error("[Socket Auth] Error: No user_id found in JWT payload.");
      return next(new Error("Authentication error: Invalid token payload"));
    }
    if (!mongoose.Types.ObjectId.isValid(userIdFromToken)) {
      console.error(
        `[Socket Auth] Error: Invalid user_id format in token: ${userIdFromToken}`
      );
      return next(new Error("Authentication error: Invalid user identifier"));
    }

    // 4. Find the user in the database
    console.log(`[Socket Auth] Finding user: ${userIdFromToken}`);
    // Note: We don't need the full user object with password excluded here.
    // Just fetching the _id is enough to verify existence and attach it.
    // Use .lean() for better performance as we don't need a full Mongoose document.
    const user = await User.findById(userIdFromToken).select("_id").lean();
    console.log("[Socket Auth] DB User found:", user);

    if (!user) {
      // User corresponding to the valid token was not found (e.g., deleted)
      console.error(
        `[Socket Auth] Authentication error: User ${userIdFromToken} not found`
      );
      return next(new Error("Authentication error: User not found"));
    }

    // 5. Attach user ID to the socket object for use in connection handlers
    socket.userId = user._id.toString(); // Store as string
    // You could potentially attach more info if needed, e.g., socket.isSeller = user.isSeller;
    // but keep it minimal unless required by connection logic.

    console.log(
      `[Socket Auth] Authentication SUCCESS for user: ${socket.userId}`
    );
    next(); // Authentication successful, proceed to the 'connection' event handler
  } catch (error) {
    // Handle JWT verification errors (expired, invalid signature etc.)
    console.error("[Socket Auth] JWT verification failed:", error.message);
    if (error.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token")); // More specific than just 'invalid token'
    }
    // Handle other potential errors during the process
    console.error("[Socket Auth] Unexpected error during auth:", error);
    return next(
      new Error("Authentication error: Could not verify credentials")
    );
  }
};

module.exports = { verifySocketToken };
