const Message = require("../model/message.model.js");
const Conversation = require("../model/conversation.model.js");
const { default: mongoose } = require("mongoose");
const Order = require("../model/order.model.js");

const FORBIDDEN_PATTERNS = [
  {
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    message:
      "Sharing email addresses is not allowed. Please use the platform for all communication.",
    type: "email",
  },
  {
    // Basic phone number pattern (can be expanded for international numbers)
    regex: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    message:
      "Sharing phone numbers is not allowed. Please use the platform for all communication.",
    type: "phone",
  },
  {
    regex:
      /\b(whatsapp|telegram|skype|zoom|viber|signal|wechat|discord|hangouts)\b/gi,
    message:
      "Mentioning external messaging platforms is not allowed. Keep your conversations here.",
    type: "external_platform_keyword",
  },
  // {
  //   regex:
  //     /\b(t\.me\/|join\.skype\.com\/|wa\.me\/|zoom\.us\/j\/|discord\.gg\/)\S+/gi,
  //   message:
  //     "Sharing links to external messaging profiles/groups is not allowed.",
  //   type: "external_platform_link",
  // },
  {
    regex:
      /(?:https?:\/\/)?(www\.)?(linkedin\.com|facebook\.com|twitter\.com|instagram\.com|behance\.net|dribbble\.com)\S*/gi,
    message:
      "Sharing links to social media or portfolio sites is not allowed here. Please use your profile.",
    type: "social_media_portfolio_link",
  },
  {
    // Generic URL, could be too broad, place it last or refine it
    regex: /(https?:\/\/[^\s]+|www\.[^\s]+)/gi,
    message:
      "Sharing external links is generally not allowed. Please communicate through the platform.",
    type: "general_link",
  },
];

function checkMessageContent(text) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    // Reset lastIndex for global regexes before each test
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) {
      return { blocked: true, message: pattern.message, type: pattern.type };
    }
  }
  return { blocked: false };
}

/**
 * Create a new message in a conversation.
 */
const createMessage = async (req, res) => {
  const { _id: userId, isSeller } = req.user; // The sender
  const { conversationId: conversationObjectId, desc } = req.body;

  // --- Basic Validation ---
  if (!mongoose.Types.ObjectId.isValid(conversationObjectId)) {
    return res.status(400).json({ message: "Invalid Conversation ID format." });
  }
  if (!desc || !desc.trim()) {
    return res
      .status(400)
      .json({ message: "Message description is required." });
  }

  // --- Content Filtering ---
  const contentCheck = checkMessageContent(desc.trim());
  if (contentCheck.blocked) {
    console.log(
      `Message blocked for user ${userId} in conversation ${conversationObjectId}. Reason: ${contentCheck.type}`
    );
    return res
      .status(400)
      .json({ message: contentCheck.message, errorType: "content_block" });
  }

  try {
    const conversation = await Conversation.findOne({
      _id: conversationObjectId,
      $or: [{ sellerId: userId }, { buyerId: userId }], // Ensure sender is part of it
    })
      .populate("sellerId", "_id")
      .populate("buyerId", "_id"); // Populate just IDs

    if (!conversation) {
      return res.status(403).json({
        message: "Conversation not found or access denied.",
      });
    }

    // Check if Order is Paid (if conversation is linked to an order) ---
    if (conversation.orderId) {
      const order = await Order.findById(conversation.orderId).select("status");
      if (!order) {
        // This case should be rare if data integrity is maintained
        console.error(
          `Order ${conversation.orderId} linked to conversation ${conversation._id} not found.`
        );
        return res.status(404).json({
          message: "Associated order not found. Cannot send message.",
        });
      }
      // Define which statuses allow messaging
      const allowedStatuses = ["in-progress", "completed"]; // Add other statuses if needed (e.g. 'disputed')
      if (!allowedStatuses.includes(order.status)) {
        return res.status(403).json({
          message: `Messaging for this order is currently disabled. Order status: ${order.status}.`,
          errorType: "order_status_block",
        });
      }
    } else {
      console.log(
        `Message in general conversation ${conversation._id} (no order linked).`
      );
    }

    const newMessage = new Message({
      conversationId: conversationObjectId, // The ObjectId of the conversation
      userId: userId, // The sender's ObjectId
      desc: desc.trim(),
    });
    const savedMessage = await newMessage.save();
    const updatedReadStatus = isSeller
      ? { readBySeller: true, readByBuyer: false }
      : { readBySeller: false, readByBuyer: true };

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationObjectId,
      {
        $set: {
          lastMessage: savedMessage.desc, // Use saved message desc
          ...updatedReadStatus,
        },
      },
      { new: true } // Return the updated document
    ).populate([
      // Populate needed fields for the socket emission
      { path: "buyerId", select: "name _id" }, // Need ID for room targeting
      { path: "sellerId", select: "name _id" },
    ]);

    // --- Socket.IO Emission (existing logic) ---
    const io = req.app.get("socketio");
    const recipientId = userId.equals(updatedConversation.sellerId._id)
      ? updatedConversation.buyerId._id.toString()
      : updatedConversation.sellerId._id.toString();

    const notificationData = {
      message: savedMessage.toObject(), // Send the full new message object
      conversation: {
        // Send updated conversation snippet
        _id: updatedConversation._id,
        id: updatedConversation.id, // composite id if needed by client
        lastMessage: updatedConversation.lastMessage,
        updatedAt: updatedConversation.updatedAt, // Mongoose timestamp
        readByBuyer: updatedConversation.readByBuyer,
        readBySeller: updatedConversation.readBySeller,
        // Include names for potential notifications
        buyerName: updatedConversation.buyerId?.name,
        sellerName: updatedConversation.sellerId?.name,
        // Include IDs for client-side logic
        buyerId: updatedConversation.buyerId?._id,
        sellerId: updatedConversation.sellerId?._id,
      },
    };

    console.log(`[Socket Emit] Emitting 'newMessage' to room: ${recipientId}`);
    io.to(recipientId).emit("newMessage", notificationData);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error in createMessage:", error);
    res.status(500).json({ message: "Failed to create message." });
  }
};

/**
 * Get messages for a conversation.
 */
const getMessages = async (req, res) => {
  // ... (your existing corrected getMessages code) ...
  const { _id: userId } = req.user;
  const { id: conversationObjectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationObjectId)) {
    return res.status(400).json({ message: "Invalid Conversation ID format." });
  }

  const conversation = await Conversation.findOne({
    _id: conversationObjectId,
    $or: [{ sellerId: userId }, { buyerId: userId }],
  });

  if (!conversation) {
    return res
      .status(403)
      .json({ message: "Access denied or conversation not found." });
  }

  const messages = await Message.find({
    conversationId: conversationObjectId,
  }).sort({ createdAt: 1 });
  res.status(200).json(messages || []); // Always return array
};

module.exports = {
  createMessage,
  getMessages,
};
