const { default: mongoose } = require("mongoose");
const Conversation = require("../model/conversation.model.js");
const Order = require("../model/order.model.js");
const User = require("../model/user.model.js");

// Helper function to get the display name
const getUserDisplayName = (user) => {
  if (!user) return "Unknown User";
  if (user.accountType === "agency") {
    return user.companyName || user.representativeName || "Unknown Agency"; // Prefer companyName
  }
  return user.name || "Unknown User"; // For individual or unspecified
};

// Helper function to get the profile picture
const getUserAvatar = (user) => {
  return user?.profilePicture || null; // Return null if not available
};

const createConversation = async (req, res) => {
  const { _id: currentUserId, isSeller } = req.user; // Renamed userId to currentUserId for clarity
  const { to: targetUserId, orderId } = req.body; // Renamed to to targetUserId

  console.log(
    `[createConversation] Initiated by User: ${currentUserId} (isSeller: ${isSeller})`
  );
  console.log(`[createConversation] Target User (to): ${targetUserId}`);
  console.log(`[createConversation] Optional Order ID: ${orderId}`);

  if (!targetUserId) {
    return res.status(400).json({ message: "Recipient ID ('to') is required" });
  }
  if (currentUserId.toString() === targetUserId.toString()) {
    return res
      .status(400)
      .json({ message: "Cannot create a conversation with yourself." });
  }

  // Determine actual buyerId and sellerId for the conversation
  const conversationSellerId = isSeller ? currentUserId : targetUserId;
  const conversationBuyerId = isSeller ? targetUserId : currentUserId;

  // Generate the consistent, unique ID for this buyer-seller pair
  // This ID does NOT include orderId, as one buyer-seller pair should have one main conversation thread.
  // The orderId can be linked as context to messages or the conversation's last relevant order.
  const conversationUniqueId = [
    conversationBuyerId.toString(),
    conversationSellerId.toString(),
  ]
    .sort()
    .join("_");

  let finalOrderIdForContext = null;

  if (orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.log(
        `[createConversation] Denied: Invalid Order ID format: ${orderId}`
      );
      return res
        .status(400)
        .json({ message: "Invalid Order ID format provided." });
    }
    const order = await Order.findById(orderId)
      .select("buyer seller status")
      .lean(); // Only select needed fields
    if (!order) {
      console.log(`[createConversation] Denied: Order ${orderId} not found.`);
      return res.status(404).json({ message: "Order not found." });
    }

    // Ensure the derived conversation participants match the order participants
    if (
      conversationBuyerId.toString() !== order.buyer.toString() ||
      conversationSellerId.toString() !== order.seller.toString()
    ) {
      console.log(
        `[createConversation] Denied: User ${currentUserId} or target ${targetUserId} not part of order ${orderId}.`
      );
      console.log(
        `   Order Buyer: ${order.buyer}, Order Seller: ${order.seller}`
      );
      console.log(
        `   Convo Buyer: ${conversationBuyerId}, Convo Seller: ${conversationSellerId}`
      );
      return res.status(403).json({
        message: "You are not authorized for this order's conversation.",
      });
    }

    // Check allowed order statuses for initiating/linking chat
    const allowedOrderStatusesForChat = [
      "pending-payment",
      "awaiting-seller-confirmation",
      "awaiting-buyer-time-adjustment",
      "accepted",
      "awaiting-buyer-scheduling",
      "scheduled",
      "in-progress",
      "completed",
      "disputed",
      "refund-requested",
      "seller-declined-awaiting-buyer",
    ];
    if (!allowedOrderStatusesForChat.includes(order.status)) {
      console.log(
        `[createConversation] Denied: Order ${orderId} status is ${order.status}, not in allowed list for chat initiation.`
      );
      return res.status(403).json({
        message: `Cannot initiate conversation for this order. Order status is '${order.status}'.`,
      });
    }
    finalOrderIdForContext = order._id; // Validated orderId to be used as context
  }

  try {
    let conversation = await Conversation.findOne({ id: conversationUniqueId });

    if (conversation) {
      console.log(
        `[createConversation] Found existing conversation with id: ${conversationUniqueId}`
      );
      // Update last message and orderId context if provided and different
      conversation.lastMessage = finalOrderIdForContext
        ? `Continuing chat regarding order #${orderId.slice(-6)}.`
        : "Conversation continued.";
      if (
        finalOrderIdForContext &&
        (!conversation.orderId ||
          conversation.orderId.toString() !== finalOrderIdForContext.toString())
      ) {
        conversation.orderId = finalOrderIdForContext; // Update context
      }
      conversation.updatedAt = new Date();
      // Mark as read by the initiator
      if (isSeller) conversation.readBySeller = true;
      else conversation.readByBuyer = true;

      const updatedConversation = await conversation.save();
      return res.status(200).json(updatedConversation);
    } else {
      console.log(
        `[createConversation] No existing conversation found for id: ${conversationUniqueId}. Creating new.`
      );
      const newConversation = new Conversation({
        id: conversationUniqueId,
        sellerId: conversationSellerId,
        buyerId: conversationBuyerId,
        orderId: finalOrderIdForContext, // Will be null if no orderId was provided/validated
        readBySeller: isSeller, // Initiator has read it
        readByBuyer: !isSeller,
        lastMessage: finalOrderIdForContext
          ? `Chat initiated for order #${orderId.slice(-6)}.`
          : "Conversation started.",
      });

      const savedConversation = await newConversation.save();
      console.log(
        `[createConversation] New conversation created with id: ${savedConversation.id}`
      );
      return res.status(201).json(savedConversation);
    }
  } catch (error) {
    if (error.code === 11000) {
      // E11000 duplicate key error
      console.error(
        `[createConversation] Duplicate key error for conversation id: ${conversationUniqueId}`,
        error
      );
      // This implies a race condition or logic error if findOne didn't catch it.
      // Attempt to fetch again as it might have been created by a concurrent request.
      const existingAfterError = await Conversation.findOne({
        id: conversationUniqueId,
      });
      if (existingAfterError) return res.status(200).json(existingAfterError);
      return res.status(409).json({
        message: "A conversation with this ID already exists or conflict.",
        detail: error.message,
      });
    }
    console.error("Error in createConversation:", error);
    return res
      .status(500)
      .json({ message: "Failed to create or update conversation." });
  }
};

const updateConversation = async (req, res) => {
  const { _id: userId, isSeller } = req.user;
  const { id } = req.params;

  const conversation = await Conversation.findById(id);

  if (
    !conversation ||
    (!conversation.sellerId.equals(userId) &&
      !conversation.buyerId.equals(userId))
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  const updatedConversation = await Conversation.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(isSeller ? { readBySeller: true } : { readByBuyer: true }),
      },
    },
    { new: true }
  );

  if (!updatedConversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  res.status(200).json(updatedConversation);
};

const getConversationById = async (req, res) => {
  const { _id: userId } = req.user;
  const { id } = req.params;

  const conversation = await Conversation.findOne({ id });

  // Ensure the user is part of the conversation (check both IDs)
  if (
    !conversation ||
    (conversation.sellerId.toString() !== userId.toString() && // Compare as strings
      conversation.buyerId.toString() !== userId.toString())
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Fetch full user details to get accountType, name/companyName, profilePicture
  const buyer = await User.findById(conversation.buyerId); //.select('name accountType companyName profilePicture'); // Be specific if needed
  const seller = await User.findById(conversation.sellerId); //.select('name accountType companyName profilePicture');

  const response = {
    ...conversation._doc, // Spread the original conversation document
    buyerName: getUserDisplayName(buyer),
    sellerName: getUserDisplayName(seller),
    buyerAvatar: getUserAvatar(buyer),
    sellerAvatar: getUserAvatar(seller),
  };

  res.status(200).json(response);
};

const getConversations = async (req, res) => {
  const { _id: userId, isSeller } = req.user;

  const filter = isSeller ? { sellerId: userId } : { buyerId: userId };
  const conversations = await Conversation.find(filter).sort({ updatedAt: -1 });

  const enrichedConversations = await Promise.all(
    conversations.map(async (conversation) => {
      // Fetch full user details
      const buyer = await User.findById(conversation.buyerId);
      const seller = await User.findById(conversation.sellerId);

      return {
        ...conversation._doc,
        buyerName: getUserDisplayName(buyer),
        sellerName: getUserDisplayName(seller),
        buyerAvatar: getUserAvatar(buyer),
        sellerAvatar: getUserAvatar(seller),
      };
    })
  );

  res.status(200).json(enrichedConversations);
};

const deleteConversation = async (req, res) => {
  const { _id: userId } = req.user;
  const { id } = req.params;

  const conversation = await Conversation.findById(id);

  if (
    !conversation ||
    (!conversation.sellerId.equals(userId) &&
      !conversation.buyerId.equals(userId))
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  await Conversation.findByIdAndDelete(id);

  res.status(200).json({ message: "Conversation deleted successfully" });
};

const markConversationRead = async (req, res) => {
  const { _id: userId, isSeller } = req.user; // Get user info from auth middleware
  const { conversationId } = req.params; // Get conversation's MongoDB _id from URL

  // Validate the ID format
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ message: "Invalid Conversation ID format." });
  }

  try {
    // Find the conversation by its MongoDB _id
    const conversation = await Conversation.findById(conversationId);

    // Check if conversation exists and if the user is part of it
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    if (
      !conversation.sellerId.equals(userId) &&
      !conversation.buyerId.equals(userId)
    ) {
      // If the user ID doesn't match either seller or buyer
      return res.status(403).json({
        message: "Access denied. You are not part of this conversation.",
      });
    }

    // Determine which field to update based on the user's role (seller/buyer)
    const updateField = isSeller
      ? { readBySeller: true }
      : { readByBuyer: true };

    // Update the conversation document
    // Using findByIdAndUpdate is efficient here
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: updateField }, // Set the appropriate read flag to true
      { new: true } // Return the modified document
    );

    if (!updatedConversation) {
      // Should not happen if findById succeeded earlier, but good practice
      return res
        .status(404)
        .json({ message: "Conversation found but failed to update." });
    }

    console.log(
      `[Mark Read] Conversation ${conversationId} marked read for ${
        isSeller ? "Seller" : "Buyer"
      } (${userId})`
    );
    // Send back a success response (updated conversation is optional)
    res.status(200).json({
      message: "Conversation marked as read.",
      conversation: updatedConversation,
    }); // Sending back updated convo can be useful
  } catch (error) {
    console.error("Error marking conversation read:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createConversation,
  updateConversation,
  getConversationById,
  getConversations,
  deleteConversation,
  markConversationRead,
};
