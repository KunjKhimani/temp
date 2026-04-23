const express = require("express");
const {
  createMessage,
  getMessages,
} = require("../controller/message.controller.js");

const asyncHandler = require("express-async-handler");
const { authMiddleware } = require("../middleware/auth.js");

const router = express.Router();

router.post("/", asyncHandler(authMiddleware), asyncHandler(createMessage));
router.get("/:id", asyncHandler(authMiddleware), asyncHandler(getMessages));

module.exports = router;
