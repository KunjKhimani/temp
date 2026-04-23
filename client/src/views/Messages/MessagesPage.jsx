/* eslint-disable no-unused-vars */
import {
  Box,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  Alert,
} from "@mui/material";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import {
  clearChatError,
  fetchConversations,
  fetchMessagesForConversation,
  resetUnreadCount,
  selectAllConversations,
  selectChatError,
  selectConversationsStatus,
  selectCurrentConversationId,
  clearCurrentChat,
} from "../../store/slice/chatSlice";
import { selectUser } from "../../store/slice/userSlice";
import SelectedChatView from "./SelectedChatView";
import ConversationList from "./ConversationList";

const MessagesPage = () => {
  // --- START: ALL HOOKS MUST BE AT THE TOP LEVEL ---
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Hook
  const location = useLocation(); // Hook
  const navigate = useNavigate(); // Hook

  const conversations = useSelector(selectAllConversations); // Hook
  const conversationsLoadStatus = useSelector(selectConversationsStatus); // Hook
  const currentUser = useSelector(selectUser); // Hook
  const chatError = useSelector(selectChatError); // Hook
  const currentConversationIdFromState = useSelector(
    selectCurrentConversationId
  ); // Hook

  const [selectedConversationId, setSelectedConversationId] = useState(null); // Hook
  // --- END: ALL HOOKS MUST BE AT THE TOP LEVEL ---

  // Effect to fetch conversations and handle URL-based selection
  useEffect(() => {
    dispatch(clearChatError());
    if (conversationsLoadStatus === "idle") {
      // Conditional logic is fine INSIDE useEffect
      dispatch(fetchConversations())
        .unwrap()
        .then((fetchedConversationsPayload) => {
          const queryParams = new URLSearchParams(location.search);
          const convoIdFromUrl = queryParams.get("conversationId");

          if (convoIdFromUrl) {
            const conversationsList =
              fetchedConversationsPayload.conversations || [];
            const exists = conversationsList.some(
              (c) => c._id === convoIdFromUrl
            );
            if (exists) {
              setSelectedConversationId(convoIdFromUrl);
            } else {
              // console.warn(...);
              // navigate(location.pathname, { replace: true });
            }
          }
        })
        .catch((err) =>
          console.error("Failed to fetch initial conversations:", err)
        );
      dispatch(resetUnreadCount());
    }
  }, [dispatch, conversationsLoadStatus, location.search, navigate]);

  // Effect to fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      if (selectedConversationId !== currentConversationIdFromState) {
        dispatch(fetchMessagesForConversation(selectedConversationId));
      }
    } else {
      if (currentConversationIdFromState) {
        dispatch(clearCurrentChat());
      }
    }
  }, [selectedConversationId, dispatch, currentConversationIdFromState]);

  const handleSelectConversation = useCallback(
    (conversationId) => {
      // ... (logic is fine here, no hooks called inside)
      const selectedConvo = conversations.find((c) => c._id === conversationId);
      if (!selectedConvo) return;
      setSelectedConversationId(conversationId);
      const queryParams = new URLSearchParams(location.search);
      queryParams.set("conversationId", conversationId);
      navigate(`${location.pathname}?${queryParams.toString()}`, {
        replace: true,
      });
    },
    [conversations, location.search, location.pathname, navigate]
  );

  const handleMobileBack = useCallback(() => {
    // ... (logic is fine here, no hooks called inside)
    setSelectedConversationId(null);
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  // --- Conditional Rendering Logic ---
  // This section is where an early return might happen *before* all hooks are defined if any hooks were below it.
  // But since all hooks are at the top, this is generally safe.

  let conversationListContent;
  if (conversationsLoadStatus === "loading") {
    conversationListContent = (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  } else if (conversationsLoadStatus === "succeeded") {
    if (conversations.length === 0) {
      conversationListContent = (
        <Typography sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
          No conversations yet.
        </Typography>
      );
    } else {
      // Conditional rendering of ConversationList is fine
      conversationListContent = (
        <ConversationList
          conversations={conversations}
          currentUser={currentUser}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      );
    }
  } else if (conversationsLoadStatus === "failed") {
    conversationListContent = (
      <Typography color="error" sx={{ p: 3, textAlign: "center" }}>
        Failed to load conversations. {chatError}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        height: "calc(100vh - 64px - 16px)",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 2, ml: { xs: 1, md: 0 } }}
      >
        Inbox
      </Typography>
      {chatError && conversationsLoadStatus === "failed" && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {chatError}
        </Alert>
      )}
      <Paper
        variant="outlined"
        sx={{
          height: "calc(100% - 48px - 16px)",
          width: "100%",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Grid container sx={{ height: "100%" }}>
          {(!isMobile || !selectedConversationId) && ( // Conditional rendering based on hook results (isMobile, selectedConversationId) is fine
            <Grid
              item
              xs={12}
              md={4}
              lg={3}
              sx={{
                borderRight: { md: `1px solid ${theme.palette.divider}` },
                height: "100%",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {conversationListContent}
            </Grid>
          )}
          {(!isMobile || selectedConversationId) && ( // Conditional rendering
            <Grid
              item
              xs={12}
              md={8}
              lg={9}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              {selectedConversationId ? ( // Conditional rendering
                <SelectedChatView
                  key={selectedConversationId}
                  conversationId={selectedConversationId}
                  onBack={isMobile ? handleMobileBack : undefined}
                />
              ) : (
                !isMobile && (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Typography>
                      Select a conversation to start chatting
                    </Typography>
                  </Box>
                )
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default MessagesPage;
