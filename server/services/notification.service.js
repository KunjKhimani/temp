// services/notification.service.js
const mongoose = require("mongoose");
const Notification = require("../model/notification.model");
const User = require("../model/user.model");
const emailUtils = require("../utils/sendEmail");
const { sendPushNotification } = require("../utils/pushNotificationService");

/**
 * Creates a database notification entry.
 * @param {object} data - Notification data ({ recipient, sender, type, title, message, link, relatedResource, relatedResourceType })
 * @returns {Promise<object>} - The saved notification document or null on error.
 */
const createDbNotification = async (data) => {
  try {
    const notification = new Notification(data);
    const savedNotification = await notification.save();
    return savedNotification;
  } catch (error) {
    console.error(
      `[NotificationService] Error creating DB notification for Recipient ${data.recipientId}:`,
      error
    );
    return null; // Indicate failure
  }
};

/**
 * Dispatches a notification via Email and Push, and emits a socket event.
 * Assumes the DB notification has already been created.
 *
 * @param {object} notification - The saved Mongoose Notification document.
 * @param {object} dispatchOptions - Options for dispatching.
 * @param {string} [dispatchOptions.emailTemplateFunc] - Name of the email template function in emailUtils.
 * @param {Array} [dispatchOptions.emailTemplateArgs] - Arguments for the email template function.
 * @param {string} [dispatchOptions.pushNotificationBody] - Specific body for push (defaults to notification.message).
 * @param {object} [dispatchOptions.pushNotificationData] - Additional data for push payload.
 * @param {object} [dispatchOptions.io] - The Socket.IO server instance (passed from controller).
 */
const dispatchNotificationChannels = async (notification, dispatchOptions) => {
  const {
    emailTemplateFunc,
    emailTemplateArgs = [],
    pushNotificationBody,
    pushNotificationData = {},
    io, // Get io instance from options
  } = dispatchOptions;

  if (!notification || !notification.recipient) {
    console.error(
      "[NotificationService] Cannot dispatch: Invalid notification object provided."
    );
    return;
  }

  // We need recipient details for email/push/socket
  const recipient = await User.findById(notification.recipient)
    .select("email name pushTokens") // Select necessary fields
    .lean();

  if (!recipient) {
    console.error(
      `[NotificationService] Recipient User ${notification.recipient} not found during dispatch.`
    );
    return;
  }

  // --- 1. Send Email ---
  if (
    emailTemplateFunc &&
    typeof emailUtils[emailTemplateFunc] === "function" &&
    recipient.email
  ) {
    try {
      const emailContent = emailUtils[emailTemplateFunc](...emailTemplateArgs);
      // Use await, but don't let email failure stop push/socket necessarily
      await emailUtils.sendEmail({
        email: recipient.email,
        subject: emailContent.subject,
        message: emailContent.text,
        html: emailContent.html,
      });
      console.log(
        `[NotificationService] Email sent: Type=${notification.type}, Recipient=${recipient._id}`
      );
    } catch (emailError) {
      console.error(
        `[NotificationService] Failed to send email for Notification ${notification._id}:`,
        emailError
      );
    }
  }

  // --- 2. Send Push Notification ---
  // In a real app, iterate through recipient.pushTokens
  if (recipient.pushTokens && recipient.pushTokens.length > 0) {
    try {
      const targetForPush = recipient.pushTokens[0] || recipient._id.toString(); // Use first token or ID as placeholder
      // Use await, but don't let push failure stop socket necessarily
      await sendPushNotification(
        targetForPush,
        notification.title,
        pushNotificationBody || notification.message, // Use specific body or default
        {
          ...pushNotificationData,
          notificationId: notification._id.toString(), // Send DB notification ID
          link: notification.link, // Send link if available
          type: notification.type,
        }
      );
      console.log(
        `[NotificationService] Push sent: Type=${notification.type}, Recipient=${recipient._id}`
      );
    } catch (pushError) {
      console.error(
        `[NotificationService] Failed to send push for Notification ${notification._id}:`,
        pushError
      );
    }
  }

  // --- 3. Emit Socket.IO event for real-time update ---
  if (io && recipient._id) {
    try {
      // Ensure the notification object includes necessary fields for the client
      const notificationObject = notification.toObject
        ? notification.toObject()
        : notification; // Handle both mongoose doc and plain obj
      if (notificationObject.sender && !notificationObject.sender.name) {
        // Basic sender population if missing
        const sender = await User.findById(notificationObject.sender)
          .select("name profilePicture")
          .lean();
        if (sender) notificationObject.sender = sender;
      }

      io.to(recipient._id.toString()).emit(
        "new_notification",
        notificationObject
      );
      console.log(
        `[NotificationService] Socket event 'new_notification' emitted to room: ${recipient._id}`
      );
    } catch (socketError) {
      console.error(
        `[NotificationService] Failed to emit socket event for Notification ${notification._id}:`,
        socketError
      );
    }
  }
};

/**
 * Convenience function: Creates DB notification and then dispatches it.
 */
const createAndDispatchNotification = async (
  notificationData,
  dispatchOptions = {}
) => {
  // Separate data for DB creation from dispatch options
  const {
    recipientId,
    senderId,
    type,
    title,
    message,
    link,
    relatedResource,
    relatedResourceType,
    status, // Add status here
  } = notificationData;

  // Data for DB Notification model
  const dbData = {
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    link,
    relatedResource,
    relatedResourceType,
    status, // Add status here
  };

  try {
    const savedDbNotification = await createDbNotification(dbData);

    if (!savedDbNotification) {
      throw new Error("Failed to save notification to database.");
    }

    // Add the io instance to dispatchOptions if it exists in notificationData (passed from controller)
    if (notificationData.io) {
      dispatchOptions.io = notificationData.io;
    }

    // Now dispatch using the saved DB notification
    await dispatchNotificationChannels(savedDbNotification, dispatchOptions);

    console.log(
      `Notification processed & dispatched: Type=${type}, Recipient=${recipientId}`
    );
    return { success: true, notification: savedDbNotification };
  } catch (error) {
    console.error(
      "Error in createAndDispatchNotification orchestrator:",
      error
    );
    // Determine if a partial success (DB saved, dispatch failed) needs special handling
    return { success: false, error: error.message };
  }
};

module.exports = {
  createDbNotification,
  dispatchNotificationChannels,
  createAndDispatchNotification, // Keep the combined one for convenience in controllers like order.controller
};
