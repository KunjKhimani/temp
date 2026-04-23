/* eslint-disable no-unused-vars */
// src/store/slice/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getConversations,
  createConversation, // Ensure this API function can take { to, orderId? }
  getMessages,
  createMessage,
  markConversationAsRead,
} from "../../services/apis";

const initialState = {
  conversations: [],
  currentConversationId: null,
  currentMessages: [],
  currentConversationDetails: null, // Will store { mongoId, compositeId, sellerId, buyerId, sellerName, buyerName, orderId? }

  conversationsStatus: "idle",
  messagesStatus: "idle",
  sendMessageStatus: "idle",
  createConversationStatus: "idle",
  updateReadStatus: "idle",

  error: null,
  sendMessageError: null, // << NEW: For specific send message errors (content block, etc.)
  unreadCount: 0,
};

// --- Async Thunks ---
export const fetchConversations = createAsyncThunk(
  /* ... (no changes needed here for orderId initially) ... */
  "chat/fetchConversations",
  async (_, thunkAPI) => {
    try {
      const response = await getConversations();
      const conversationsData = response.data || [];
      const currentUser = thunkAPI.getState().user.user;
      let initialUnreadCount = 0;
      if (currentUser?._id && currentUser.isSeller !== undefined) {
        initialUnreadCount = conversationsData.reduce((count, convo) => {
          const isUnread = currentUser.isSeller
            ? !convo.readBySeller
            : !convo.readByBuyer;
          return count + (isUnread ? 1 : 0);
        }, 0);
      }
      return { conversations: conversationsData, initialUnreadCount };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversations"
      );
    }
  }
);

export const getOrCreateConversation = createAsyncThunk(
  "chat/getOrCreateConversation",
  // << MODIFIED: Accept orderId
  async ({ targetUserId, currentUserId, orderId }, thunkAPI) => {
    const userState = thunkAPI.getState().user;
    if (!userState.user?._id || userState.user.isSeller === undefined) {
      return thunkAPI.rejectWithValue("User data incomplete");
    }
    const isCurrentUserSeller = userState.user.isSeller;
    const potentialId = isCurrentUserSeller
      ? `${currentUserId}${targetUserId}`
      : `${targetUserId}${currentUserId}`;
    let existingConversation = thunkAPI
      .getState()
      .chat.conversations.find((c) => c.id === potentialId);

    // If trying to get/create for a specific order, and the existing general chat isn't linked
    // OR if the existing general chat IS linked but to a DIFFERENT order,
    // the backend `createConversation` should handle creating/linking appropriately.
    // Our client-side check for `existingConversation` is primarily for UI optimization.

    if (
      !existingConversation &&
      thunkAPI.getState().chat.conversationsStatus !== "succeeded" &&
      thunkAPI.getState().chat.conversationsStatus !== "loading"
    ) {
      try {
        await thunkAPI.dispatch(fetchConversations()).unwrap();
        existingConversation = thunkAPI
          .getState()
          .chat.conversations.find((c) => c.id === potentialId);
      } catch (fetchError) {
        /* ... */
      }
    }

    try {
      let conversationToUse;
      const createPayload = { to: targetUserId };
      if (orderId) {
        createPayload.orderId = orderId;
      }
      console.log(
        "[getOrCreateConversation] API Request Payload to /conversation:",
        JSON.stringify(createPayload)
      );
      const createResponse = await createConversation(createPayload);
      console.log(
        "[getOrCreateConversation] API Response from /conversation:",
        JSON.stringify(createResponse)
      ); // Log the WHOLE response
      console.log(
        "[getOrCreateConversation] API Response data from /conversation:",
        JSON.stringify(createResponse?.data)
      ); // Log just the data

      conversationToUse = createResponse?.data; // Assign data

      if (!conversationToUse?._id) {
        // Check if data itself or _id is missing
        console.error(
          "[getOrCreateConversation] ERROR: conversationToUse or conversationToUse._id is missing. conversationToUse:",
          conversationToUse
        );
        throw new Error(
          "Failed to obtain valid conversation reference with _id"
        );
      }

      thunkAPI.dispatch(addOrUpdateConversationLocally(conversationToUse)); // Use a new reducer

      const messagesResponse = await getMessages(conversationToUse._id);
      if (!Array.isArray(messagesResponse.data))
        throw new Error(
          messagesResponse.data?.message || "Invalid message response"
        );

      if (userState.user) {
        thunkAPI.dispatch(
          markConversationReadLocally({
            conversationId: conversationToUse._id,
            userId: userState.user._id,
            isSeller: userState.user.isSeller,
          })
        );
        thunkAPI.dispatch(
          updateReadStatus({ conversationId: conversationToUse._id })
        );
      }
      return {
        conversation: conversationToUse,
        messages: messagesResponse.data,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to get/create conversation"
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ conversationId, desc }, thunkAPI) => {
    const currentUserId = thunkAPI.getState().user.user?._id;
    if (!currentUserId) return thunkAPI.rejectWithValue("User not logged in");
    if (!conversationId || !desc?.trim())
      return thunkAPI.rejectWithValue("Missing conversation ID or message");

    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const optimisticMessage = {
      _id: tempId,
      tempId,
      conversationId,
      userId: currentUserId,
      desc: desc.trim(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      thunkAPI.dispatch(addMessageOptimistic(optimisticMessage));
      const response = await createMessage({ conversationId, desc }); // API call
      return response.data;
    } catch (error) {
      thunkAPI.dispatch(removeOptimisticMessage(tempId));
      // << MODIFIED: Pass full error object for detailed error handling in UI
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to send message",
        }
      );
    }
  }
);

export const fetchMessagesForConversation = createAsyncThunk(
  /* ... (no direct changes for orderId, but details will include it) ... */
  "chat/fetchMessagesForConversation",
  async (conversationId, thunkAPI) => {
    try {
      const response = await getMessages(conversationId);
      if (!Array.isArray(response.data))
        throw new Error(response.data?.message || "Invalid message response");
      const existingConversation = thunkAPI
        .getState()
        .chat.conversations.find((c) => c._id === conversationId);
      const currentUser = thunkAPI.getState().user.user;
      if (currentUser) {
        thunkAPI.dispatch(
          markConversationReadLocally({
            conversationId: conversationId,
            userId: currentUser._id,
            isSeller: currentUser.isSeller,
          })
        );
        thunkAPI.dispatch(updateReadStatus({ conversationId: conversationId }));
      }
      return {
        conversationId,
        messages: response.data,
        details: existingConversation,
      }; // details will have orderId if present
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch messages"
      );
    }
  }
);

export const updateReadStatus = createAsyncThunk(
  /* ... (no changes needed) ... */
  "chat/updateReadStatus",
  async ({ conversationId }, thunkAPI) => {
    try {
      await markConversationAsRead(conversationId);
      return { conversationId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update read status"
      );
    }
  }
);

// --- Slice Definition ---
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessageOptimistic: (state, action) => {
      /* ... (no changes) ... */
      const optimisticMessage = action.payload;
      if (state.currentConversationId === optimisticMessage.conversationId) {
        if (
          !state.currentMessages.some(
            (m) => m.tempId === optimisticMessage.tempId
          )
        ) {
          state.currentMessages.push(optimisticMessage);
        }
      }
      state.sendMessageStatus = "loading";
      state.sendMessageError = null; // Clear previous error
    },
    removeOptimisticMessage: (state, action) => {
      /* ... (no changes) ... */
      const tempIdToRemove = action.payload;
      state.currentMessages = state.currentMessages.filter(
        (m) => m.tempId !== tempIdToRemove
      );
    },
    handleIncomingMessage: (state, action) => {
      const { message: incomingMessage, conversation: updatedConvoSnippet } =
        action.payload;
      const currentUserId = state.user?.user?._id; // Assuming user state is accessible or passed via middleware
      if (!incomingMessage?._id || !updatedConvoSnippet?._id) return;

      let conversationUpdated = false;
      let shouldIncrementUnread = true;
      const isMessageFromSelf =
        currentUserId && incomingMessage.userId === currentUserId;

      const convoIndex = state.conversations.findIndex(
        (c) => c._id === updatedConvoSnippet._id
      );
      const convoDataToUpdate = {
        ...updatedConvoSnippet, // This snippet from socket should include orderId if present
        // Preserve existing names if snippet doesn't have them fully populated
        buyerName:
          (convoIndex !== -1
            ? state.conversations[convoIndex].buyerName
            : null) ||
          updatedConvoSnippet.buyerName ||
          "Buyer",
        sellerName:
          (convoIndex !== -1
            ? state.conversations[convoIndex].sellerName
            : null) ||
          updatedConvoSnippet.sellerName ||
          "Seller",
        buyerAvatar:
          (convoIndex !== -1
            ? state.conversations[convoIndex].buyerAvatar
            : null) || updatedConvoSnippet.buyerAvatar,
        sellerAvatar:
          (convoIndex !== -1
            ? state.conversations[convoIndex].sellerAvatar
            : null) || updatedConvoSnippet.sellerAvatar,
      };

      if (convoIndex !== -1) {
        state.conversations[convoIndex] = {
          ...state.conversations[convoIndex],
          ...convoDataToUpdate,
        };
        const [updatedConvo] = state.conversations.splice(convoIndex, 1);
        state.conversations.unshift(updatedConvo);
        conversationUpdated = true;
      } else {
        state.conversations.unshift(convoDataToUpdate);
        conversationUpdated = true;
      }

      if (state.currentConversationId === incomingMessage.conversationId) {
        shouldIncrementUnread = false;
        const optimisticIndex = state.currentMessages.findIndex(
          (m) => m.tempId && m.tempId === incomingMessage.tempId
        );
        const existingIndexById = state.currentMessages.findIndex(
          (m) => m._id === incomingMessage._id
        );
        if (isMessageFromSelf && optimisticIndex !== -1) {
          state.currentMessages[optimisticIndex] = {
            ...incomingMessage,
            status: "sent",
          };
        } else if (existingIndexById === -1) {
          state.currentMessages.push({
            ...incomingMessage,
            status: isMessageFromSelf ? "sent" : "received",
          });
        }
        // Auto-mark as read if viewing
        if (state.currentConversationDetails && !isMessageFromSelf) {
          const currentUser = state.user?.user;
          if (currentUser) {
            if (currentUser.isSeller)
              state.currentConversationDetails.readBySeller = true;
            else state.currentConversationDetails.readByBuyer = true;
            // Also update in the main list
            const currentListConvo = state.conversations.find(
              (c) => c._id === state.currentConversationId
            );
            if (currentListConvo) {
              if (currentUser.isSeller) currentListConvo.readBySeller = true;
              else currentListConvo.readByBuyer = true;
            }
          }
        }
      }
      if (shouldIncrementUnread && !isMessageFromSelf && conversationUpdated) {
        state.unreadCount = (state.unreadCount || 0) + 1;
      }
    },
    markConversationReadLocally: (state, action) => {
      /* ... (no changes) ... */
      const { conversationId, userId, isSeller } = action.payload;
      if (!userId || isSeller === undefined) return;
      const convoIndex = state.conversations.findIndex(
        (c) => c._id === conversationId
      );
      if (convoIndex !== -1) {
        const conversation = state.conversations[convoIndex];
        let wasUnread = false;
        if (isSeller && !conversation.readBySeller) {
          wasUnread = true;
          conversation.readBySeller = true;
        } else if (!isSeller && !conversation.readByBuyer) {
          wasUnread = true;
          conversation.readByBuyer = true;
        }
        if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    clearChatError: (state) => {
      state.error = null;
    },
    // << NEW/MODIFIED Reducer
    addOrUpdateConversationLocally: (state, action) => {
      const newConvo = action.payload; // This convo from backend should have orderId if applicable
      const existingIndex = state.conversations.findIndex(
        (c) => (c._id && c._id === newConvo._id) || c.id === newConvo.id
      );
      if (existingIndex !== -1) {
        // Preserve richer client-side data if backend only sends partial on update
        state.conversations[existingIndex] = {
          ...state.conversations[existingIndex], // Keep existing avatar/name if not in newConvo
          ...newConvo, // Overwrite with new data (like orderId, lastMessage, readStatus)
        };
      } else {
        state.conversations.unshift(newConvo);
      }
    },
    clearChatState: (state) => {
      Object.assign(state, initialState);
    },
    clearCurrentChat: (state) => {
      state.currentConversationId = null;
      state.currentMessages = [];
      state.currentConversationDetails = null;
      state.messagesStatus = "idle";
      state.sendMessageError = null; // Clear send error when chat is closed
    },
    // << NEW Reducer
    linkOrderToConversation: (state, action) => {
      const { conversationId, orderId } = action.payload; // conversationId is MongoDB _id
      const convoIndex = state.conversations.findIndex(
        (c) => c._id === conversationId
      );
      if (convoIndex !== -1) {
        state.conversations[convoIndex].orderId = orderId;
        // Optionally update updatedAt or lastMessage if backend provides it
      }
      // If this conversation is currently open, update its details too
      if (state.currentConversationDetails?._id === conversationId) {
        state.currentConversationDetails.orderId = orderId;
      }
    },
    // << NEW Reducer
    clearSendMessageError: (state) => {
      state.sendMessageError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsStatus = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsStatus = "succeeded";
        state.conversations = action.payload.conversations;
        state.unreadCount = action.payload.initialUnreadCount;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsStatus = "failed";
        state.error = action.payload;
      })

      .addCase(getOrCreateConversation.pending, (state) => {
        state.createConversationStatus = "loading";
        state.messagesStatus = "loading"; // Also loading messages
        state.sendMessageError = null; // Clear previous send errors
      })
      .addCase(getOrCreateConversation.fulfilled, (state, action) => {
        state.createConversationStatus = "succeeded";
        state.messagesStatus = "succeeded";
        const convo = action.payload.conversation; // Includes orderId if applicable
        state.currentConversationId = convo._id;
        state.currentMessages = action.payload.messages.map((m) => ({
          ...m,
          status: "received",
        }));
        state.currentConversationDetails = {
          // Populate with all details
          _id: convo._id, // mongoId
          id: convo.id, // compositeId
          sellerId: convo.sellerId,
          buyerId: convo.buyerId,
          sellerName: convo.sellerName || "Seller",
          buyerName: convo.buyerName || "Buyer",
          sellerAvatar: convo.sellerAvatar, // Assuming backend provides these
          buyerAvatar: convo.buyerAvatar,
          orderId: convo.orderId, // << Store orderId
          readByBuyer: convo.readByBuyer,
          readBySeller: convo.readBySeller,
          lastMessage: convo.lastMessage,
          updatedAt: convo.updatedAt,
        };
      })
      .addCase(getOrCreateConversation.rejected, (state, action) => {
        state.createConversationStatus = "failed";
        state.messagesStatus = "failed";
        state.error = action.payload;
        state.currentConversationId = null;
        state.currentMessages = [];
        state.currentConversationDetails = null;
      })

      .addCase(sendMessage.pending, (state) => {
        // state.sendMessageStatus is 'loading' due to addMessageOptimistic
        state.sendMessageError = null; // Clear on new attempt
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendMessageStatus = "succeeded";
        const confirmedMessage = action.payload;
        // Socket echo in handleIncomingMessage will replace the optimistic message
        // and update conversation's lastMessage & read status.
        // Update lastMessage & read status in currentConversationDetails if viewing
        if (
          state.currentConversationDetails &&
          state.currentConversationDetails._id ===
            confirmedMessage.conversationId
        ) {
          state.currentConversationDetails.lastMessage = confirmedMessage.desc;
          state.currentConversationDetails.updatedAt =
            confirmedMessage.createdAt;
          // Set read status for the sender
          const currentUser = state.user?.user;
          if (currentUser) {
            if (currentUser._id === confirmedMessage.userId) {
              // Message sent by current user
              if (currentUser.isSeller)
                state.currentConversationDetails.readBySeller = true;
              else state.currentConversationDetails.readByBuyer = true;
            }
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendMessageStatus = "failed";
        state.sendMessageError = action.payload; // This is { message: "...", errorType: "..." }
      })

      .addCase(fetchMessagesForConversation.pending, (state, action) => {
        if (state.currentConversationId !== action.meta.arg)
          state.currentMessages = [];
        state.messagesStatus = "loading";
        state.sendMessageError = null; // Clear previous send errors
      })
      .addCase(fetchMessagesForConversation.fulfilled, (state, action) => {
        if (
          action.meta.arg === state.currentConversationId ||
          state.currentConversationId === null ||
          action.meta.arg === action.payload.conversationId
        ) {
          state.messagesStatus = "succeeded";
          state.currentConversationId = action.payload.conversationId;
          state.currentMessages = action.payload.messages.map((m) => ({
            ...m,
            status: "received",
          }));
          if (action.payload.details) {
            const convoDetails = action.payload.details;
            state.currentConversationDetails = {
              // Populate with all details
              _id: convoDetails._id, // mongoId
              id: convoDetails.id, // compositeId
              sellerId: convoDetails.sellerId,
              buyerId: convoDetails.buyerId,
              sellerName: convoDetails.sellerName || "Seller",
              buyerName: convoDetails.buyerName || "Buyer",
              sellerAvatar: convoDetails.sellerAvatar,
              buyerAvatar: convoDetails.buyerAvatar,
              orderId: convoDetails.orderId, // << Store orderId
              readByBuyer: convoDetails.readByBuyer,
              readBySeller: convoDetails.readBySeller,
              lastMessage: convoDetails.lastMessage,
              updatedAt: convoDetails.updatedAt,
            };
          } else {
            state.currentConversationDetails = null;
          }
        } else {
          if (state.messagesStatus === "loading") state.messagesStatus = "idle";
        }
      })
      .addCase(fetchMessagesForConversation.rejected, (state, action) => {
        /* ... (as before) ... */
        if (
          action.meta.arg === state.currentConversationId ||
          state.currentConversationId === null
        ) {
          state.messagesStatus = "failed";
          state.error = action.payload;
          state.currentMessages = [];
          state.currentConversationDetails = null;
        } else {
          if (state.messagesStatus === "loading") state.messagesStatus = "idle";
        }
      })

      .addCase(updateReadStatus.pending, (state) => {
        state.updateReadStatus = "loading";
      })
      .addCase(updateReadStatus.fulfilled, (state) => {
        state.updateReadStatus = "succeeded";
      })
      .addCase(updateReadStatus.rejected, (state, action) => {
        state.updateReadStatus = "failed"; /* Store error? */
      });
  },
});

export const {
  // addConversationLocally, // Replaced by addOrUpdateConversationLocally
  addOrUpdateConversationLocally,
  addMessageOptimistic,
  removeOptimisticMessage,
  clearChatState,
  // setCurrentChat, // Usually handled by thunks now
  clearChatError,
  clearCurrentChat,
  handleIncomingMessage,
  markConversationReadLocally,
  resetUnreadCount,
  linkOrderToConversation, // << EXPORTED
  clearSendMessageError, // << EXPORTED
} = chatSlice.actions;

export default chatSlice.reducer;

export const selectAllConversations = (state) => state.chat.conversations;
export const selectConversationsStatus = (state) =>
  state.chat.conversationsStatus;
export const selectCurrentConversationId = (state) =>
  state.chat.currentConversationId;
export const selectCurrentMessages = (state) => state.chat.currentMessages;
export const selectMessagesStatus = (state) => state.chat.messagesStatus;
export const selectSendMessageStatus = (state) => state.chat.sendMessageStatus;
export const selectChatError = (state) => state.chat.error;
export const selectCurrentConversationDetails = (state) =>
  state.chat.currentConversationDetails;
export const selectUnreadCount = (state) => state.chat.unreadCount;
export const selectSendMessageError = (state) => state.chat.sendMessageError; // << EXPORTED

export const selectCurrentChatTargetName = (state) => {
  /* ... (as before) ... */
  const details = state.chat.currentConversationDetails;
  const currentUser = state.user?.user;
  if (!details || !currentUser) return "Chat";
  // Assuming currentConversationDetails.sellerId and .buyerId are populated ObjectIds (or strings)
  // And currentConversationDetails.sellerName and .buyerName are populated strings
  return currentUser._id === details.buyerId.toString() // Compare as strings if one is ObjectId and other is string
    ? details.sellerName
    : details.buyerName;
};
