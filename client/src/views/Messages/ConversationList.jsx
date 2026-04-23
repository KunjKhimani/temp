/* eslint-disable react/prop-types */
// src/views/Messages/ConversationList.jsx
import React from "react";
import { List, Divider } from "@mui/material";
import ConversationListItem from "./ConversationListItem"; // Import the item component

const ConversationList = ({
  conversations = [],
  currentUser,
  selectedConversationId,
  onSelectConversation,
}) => {
  return (
    <List disablePadding sx={{ width: "100%", flexGrow: 1 }}>
      {conversations.map((conv, index) => (
        <React.Fragment key={conv._id}>
          <ConversationListItem
            conversation={conv}
            currentUser={currentUser}
            isSelected={conv._id === selectedConversationId}
            onSelect={() => onSelectConversation(conv._id)}
          />
          {index < conversations.length - 1 && (
            <Divider variant="inset" component="li" />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ConversationList;
