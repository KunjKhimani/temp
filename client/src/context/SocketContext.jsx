/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import io from "socket.io-client";
import { useSelector, useDispatch, useStore } from "react-redux"; // Added useStore
import { selectIsLoggedIn, selectUser } from "../store/slice/userSlice";
import {
  handleIncomingMessage,
  linkOrderToConversation, // << IMPORT ACTION
  selectCurrentConversationId,
} from "../store/slice/chatSlice";
import { useNotification } from "../context/NotificationContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useDispatch();
  const store = useStore(); // Get Redux store instance

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentUser = useSelector(selectUser);
  // No longer need currentConversationIdFromState directly in this useCallback,
  // as handleIncomingMessage reducer will check it using getState() if needed, or passed from component
  const { showNotification } = useNotification();

  const onNewMessageHandler = useCallback(
    (data) => {
      console.log('[Socket Receive] "newMessage":', data);
      if (data?.message && data?.conversation?._id) {
        dispatch(handleIncomingMessage(data)); // Redux updates list, current messages, unread count

        // Access currentConversationId from the store *at the time of execution*
        const currentOpenConvoId = store.getState().chat.currentConversationId;

        if (data.conversation._id !== currentOpenConvoId) {
          const senderName =
            currentUser?._id === data.conversation.buyerId
              ? data.conversation.sellerName
              : data.conversation.buyerName;
          showNotification(
            `New message from ${senderName || "Someone"}`,
            "info",
            "New Message"
          );
        } else {
          // If chat is open, component showing the chat should trigger markAsRead
        }
      } else {
        console.warn(
          "[Socket Receive] 'newMessage' with unexpected data:",
          data
        );
      }
    },
    [dispatch, currentUser, showNotification, store] // Added store
  );

  // Handler for general notifications
  const onNewNotificationHandler = useCallback(
    (notificationData) => {
      console.log('[Socket Receive] "new_notification":', notificationData);
      if (notificationData?.message) {
        showNotification(
          notificationData.message,
          notificationData.severity || "info",
          notificationData.title || "Notification"
        );
      }
    },
    [showNotification]
  );

  // Handler for order status updates
  const onOrderStatusUpdatedHandler = useCallback(
    (orderUpdateData) => {
      console.log('[Socket Receive] "order_status_updated":', orderUpdateData);
      if (orderUpdateData?.orderId && orderUpdateData?.status) {
        // You might want to dispatch an action to update the order in Redux state
        // For now, let's just show a notification if it's relevant
        showNotification(
          `Order #${orderUpdateData.orderId.slice(-6)} status: ${
            orderUpdateData.status
          }`,
          "info",
          "Order Update"
        );
      }
    },
    [showNotification]
  );

  // << NEW HANDLER for conversation updates (e.g., order linking) >>
  const onConversationUpdatedHandler = useCallback(
    (updatedConversation) => {
      console.log(
        '[Socket Receive] "conversationUpdated":',
        updatedConversation
      );
      if (updatedConversation?._id && updatedConversation.orderId) {
        dispatch(
          linkOrderToConversation({
            conversationId: updatedConversation._id,
            orderId: updatedConversation.orderId,
            // Pass other fields if your reducer needs to update more than just orderId
            lastMessage: updatedConversation.lastMessage,
            updatedAt: updatedConversation.updatedAt,
            readByBuyer: updatedConversation.readByBuyer,
            readBySeller: updatedConversation.readBySeller,
          })
        );
        // Optionally, show a notification if this update is significant
        // showNotification(`Chat for Order #${updatedConversation.orderId.slice(-4)} is now active.`, "success");
      } else {
        console.warn(
          "[Socket Receive] 'conversationUpdated' with unexpected data:",
          updatedConversation
        );
      }
    },
    [dispatch /*, showNotification (if you add notifications here) */]
  );

  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem("token");
      if (token && !socketRef.current) {
        console.log(
          `[SocketProvider] Attempting socket connection to ${SOCKET_URL}...`
        );
        const newSocket = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket", "polling"],
        });
        socketRef.current = newSocket;

        newSocket.on("connect", () => {
          console.log("[SocketProvider] Socket connected:", newSocket.id);
          setIsConnected(true);
        });
        newSocket.on("disconnect", (reason) => {
          console.log("[SocketProvider] Socket disconnected:", reason);
          setIsConnected(false);
          if (socketRef.current === newSocket) socketRef.current = null;
        });
        newSocket.on("connect_error", (err) => {
          console.error(
            "[SocketProvider] Socket connection error:",
            err.message
          );
          setIsConnected(false);
          if (socketRef.current === newSocket) socketRef.current = null;
        });

        newSocket.on("newMessage", onNewMessageHandler);
        newSocket.on("conversationUpdated", onConversationUpdatedHandler); // << REGISTER NEW HANDLER
        newSocket.on("new_notification", onNewNotificationHandler); // Register new notification handler
        newSocket.on("order_status_updated", onOrderStatusUpdatedHandler); // Register order status update handler
      }
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    }

    return () => {
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.off("connect");
        currentSocket.off("disconnect");
        currentSocket.off("connect_error");
        currentSocket.off("newMessage", onNewMessageHandler);
        currentSocket.off("conversationUpdated", onConversationUpdatedHandler); // << UNREGISTER
        currentSocket.off("new_notification", onNewNotificationHandler); // Unregister
        currentSocket.off("order_status_updated", onOrderStatusUpdatedHandler); // Unregister
        currentSocket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [
    isLoggedIn,
    onNewMessageHandler,
    onConversationUpdatedHandler,
    onNewNotificationHandler,
    onOrderStatusUpdatedHandler,
    dispatch,
  ]); // Added new handlers to dependencies

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
