const mongoose = require("mongoose");
const { Schema } = mongoose;

const ConversationSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: false, // A conversation might not (yet) be tied to an order
      index: true, // Good for finding conversations related to an order
    },
    readBySeller: {
      type: Boolean,
      default: false,
    },
    readByBuyer: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ sellerId: 1, updatedAt: -1 });
ConversationSchema.index({ buyerId: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = Conversation;
