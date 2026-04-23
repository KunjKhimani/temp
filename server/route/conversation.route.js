// route/conversation.route.js
const express = require("express");
const {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation, // Keep existing update route if needed
  deleteConversation, // Keep existing delete route if needed
  markConversationRead, // <-- Import the new controller function
} = require("../controller/conversation.controller.js");
const { authMiddleware } = require("../middleware/auth.js"); // Assuming this middleware attaches req.user
const asyncHandler = require("express-async-handler");

const router = express.Router();

// Existing routes
router.get("/", asyncHandler(authMiddleware), asyncHandler(getConversations));
router.post(
  "/",
  asyncHandler(authMiddleware),
  asyncHandler(createConversation)
);
router.get(
  "/:id",
  asyncHandler(authMiddleware),
  asyncHandler(getConversationById)
); // Assumes :id is Mongo _id now?
router.put(
  "/:id",
  asyncHandler(authMiddleware),
  asyncHandler(updateConversation)
); // Assumes :id is Mongo _id now?
router.delete(
  "/:id",
  asyncHandler(authMiddleware),
  asyncHandler(deleteConversation)
); // Assumes :id is Mongo _id now?

// ---> NEW ROUTE for Marking as Read <---
// PUT /api/conversation/:conversationId/read
router.put(
  "/:conversationId/read", // Use a distinct path
  asyncHandler(authMiddleware), // Requires user to be logged in
  asyncHandler(markConversationRead) // Use the new controller function
);
// --- End New Route ---

module.exports = router;
