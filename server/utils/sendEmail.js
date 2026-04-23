// utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config(); // Good practice if not done globally

// Validate essential environment variables for this module
if (
  !process.env.EMAIL_HOST ||
  !process.env.EMAIL_PORT ||
  !process.env.EMAIL_USERNAME ||
  !process.env.EMAIL_PASSWORD ||
  !process.env.EMAIL_FROM_ADDRESS
) {
  console.error(
    "FATAL ERROR: Email configuration missing in environment variables (checked in sendEmail.js)."
  );
  process.exit(1); // Exit if critical config is missing
}

const APP_NAME = process.env.EMAIL_FROM_NAME || "SpareWork";
const APP_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173"; // For links in emails

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USERNAME, // Should be "apikey" for SendGrid API Key
    pass: process.env.EMAIL_PASSWORD, // Should be the SendGrid API Key
  },
});

const sendEmail = async (options) => {
  const mailOptions = {
    // Use EMAIL_FROM_NAME from .env if available, otherwise default
    from: `"${process.env.EMAIL_FROM_NAME || "Spare Work"}" <${
      process.env.EMAIL_FROM_ADDRESS
    }>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Pass HTML content if provided
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    // Log detailed SendGrid error if available
    if (error.response) {
      console.error("SendGrid Response Error:", error.response.body);
    }
    return { success: false, error: error };
  }
};

// --- Helper function to send the actual verification email (CODE ONLY) ---
// *** REMOVED 'export' keyword from here ***
const sendVerificationEmail = async (user, verificationCode) => {
  // Validate essential input for the email content
  if (!user || !verificationCode) {
    console.error("Missing user or code for sending verification email.");
    return; // Should ideally return a failure indicator or throw
  }

  const subject = "Verify Your Email Address";
  const message = `
Hello ${user.name || "User"},

Thank you for registering! Please enter the following code in the app to verify your email address. This code is valid for 1 hour.

Verification Code: ${verificationCode}

If you did not create an account, please ignore this email.

Best regards,
Your App Team
  `;
  const htmlMessage = `
<p>Hello ${user.name || "User"},</p>
<p>Thank you for registering! Please enter the following code in the app to verify your email address. This code is valid for <strong>1 hour</strong>.</p>
<p style="font-size: 1.8em; font-weight: bold; letter-spacing: 3px; color: #333;">${verificationCode}</p>
<hr>
<p>If you did not create an account, please ignore this email.</p>
<p>Best regards,<br>Your App Team</p>
  `;

  // Use the generic sendEmail function defined above
  try {
    // Construct the options object for sendEmail
    const emailResult = await sendEmail({
      email: user.email,
      subject: subject,
      message: message, // Text version
      html: htmlMessage, // HTML version
    });

    // Log success/failure based on the result from sendEmail
    if (emailResult.success) {
      console.log(
        `Verification email (code only) sent successfully to ${user.email} via sendEmail function.`
      );
    } else {
      // Error is already logged inside sendEmail, but we can add context
      console.error(
        `sendEmail function failed when sending verification code to ${user.email}.`
      );
    }
    // Return the result in case the caller needs it
    return emailResult;
  } catch (error) {
    // This catch might be redundant if sendEmail handles its own errors,
    // but good for catching unexpected issues in constructing the options.
    console.error(
      `Unexpected error in sendVerificationEmail function for ${user.email}:`,
      error
    );
    return { success: false, error: error };
  }
};

const generateNewOrderEmailForSeller = (seller, buyer, order, service) => {
  const orderLink = `${APP_URL}/seller/orders/${order._id}`; // Example link
  return {
    subject: `[${APP_NAME}] New Order Received for "${service.title}" - Action Required!`,
    text: `Hello ${
      seller.name || "Seller"
    },\n\nYou have received a new order (#${order._id
      .toString()
      .slice(-6)}) from ${buyer.name || "Buyer"} for your service: "${
      service.title
    }".\nTotal Amount: $${order.totalPrice.toFixed(
      2
    )}\n\nPlease review the order details and accept or decline it within 24-48 hours.\nView Order: ${orderLink}\n\nThanks,\nThe ${APP_NAME} Team`,
    html: `
      <p>Hello ${seller.name || "Seller"},</p>
      <p>You have received a new order (<strong>#${order._id
        .toString()
        .slice(-6)}</strong>) from <strong>${
      buyer.name || "Buyer"
    }</strong> for your service: "<strong>${service.title}</strong>".</p>
      <p><strong>Total Amount:</strong> $${order.totalPrice.toFixed(2)}</p>
      <p>Please review the order details and accept or decline it within 24-48 hours via your dashboard.</p>
      <p><a href="${orderLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View and Manage Order</a></p>
      <br/>
      <p>Thanks,<br/>The ${APP_NAME} Team</p>
    `,
  };
};

const generateOrderPaymentConfirmedEmailForBuyer = (buyer, order, service) => {
  const orderLink = `${APP_URL}/buyer/orders/${order._id}`; // Example link
  return {
    subject: `[${APP_NAME}] Payment Confirmed for Order #${order._id
      .toString()
      .slice(-6)}`,
    text: `Hello ${
      buyer.name || "Buyer"
    },\n\nYour payment for order #${order._id.toString().slice(-6)} ("${
      service.title
    }") has been successfully confirmed.\nThe total amount paid was $${order.totalPrice.toFixed(
      2
    )}.\n\nThe seller has been notified and will review your order shortly. You will be updated once the seller accepts or declines.\nView Order: ${orderLink}\n\nThanks,\nThe ${APP_NAME} Team`,
    html: `
      <p>Hello ${buyer.name || "Buyer"},</p>
      <p>Your payment for order <strong>#${order._id
        .toString()
        .slice(-6)}</strong> ("${
      service.title
    }") has been successfully confirmed.</p>
      <p><strong>Total Amount Paid:</strong> $${order.totalPrice.toFixed(2)}</p>
      <p>The seller has been notified and will review your order shortly. You will receive another notification once the seller accepts or declines your order.</p>
      <p><a href="${orderLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Your Order</a></p>
      <br/>
      <p>Thanks,<br/>The ${APP_NAME} Team</p>
    `,
  };
};

const generateOrderAcceptedEmailForBuyer = (buyer, order, service) => {
  const orderLink = `${APP_URL}/buyer/orders/${order._id}`;
  const chatLink = `${APP_URL}/chat/${order.seller._id}`; // Assuming direct chat link to seller or conversation
  return {
    subject: `[${APP_NAME}] Great News! Your Order #${order._id
      .toString()
      .slice(-6)} Has Been Accepted!`,
    text: `Hello ${
      buyer.name || "Buyer"
    },\n\nGood news! The seller has accepted your order (#${order._id
      .toString()
      .slice(-6)}) for "${
      service.title
    }".\nThe service is now scheduled to proceed.\n\nYou can view the order details here: ${orderLink}\nIf you need to discuss details, you can message the seller: ${chatLink}\n\nThanks,\nThe ${APP_NAME} Team`,
    html: `
      <p>Hello ${buyer.name || "Buyer"},</p>
      <p>Good news! The seller has accepted your order <strong>#${order._id
        .toString()
        .slice(-6)}</strong> for "<strong>${service.title}</strong>".</p>
      <p>The service is now scheduled to proceed. You can coordinate further details with the seller if needed.</p>
      <p><a href="${orderLink}" style="padding: 8px 12px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">View Order Details</a>
         <a href="${chatLink}" style="padding: 8px 12px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 5px;">Message Seller</a></p>
      <br/>
      <p>Thanks,<br/>The ${APP_NAME} Team</p>
    `,
  };
};

const generateOrderDeclinedEmailForBuyer = (
  buyer,
  order,
  service,
  reason = ""
) => {
  const orderLink = `${APP_URL}/buyer/orders/${order._id}`;
  const servicesLink = `${APP_URL}/services`;
  let reasonText = reason
    ? `\nReason provided by seller: ${reason}`
    : "\nThe seller did not provide a specific reason.";
  let reasonHtml = reason
    ? `<p><strong>Reason provided by seller:</strong> ${reason}</p>`
    : `<p>The seller did not provide a specific reason.</p>`;

  return {
    subject: `[${APP_NAME}] Update on Your Order #${order._id
      .toString()
      .slice(-6)} - Declined`,
    text: `Hello ${
      buyer.name || "Buyer"
    },\n\nWe regret to inform you that your order (#${order._id
      .toString()
      .slice(-6)}) for "${
      service.title
    }" has been declined by the seller.${reasonText}\nYour payment of $${order.totalPrice.toFixed(
      2
    )} will be refunded. Please allow 3-7 business days for the refund to reflect in your account.\nView Order Details: ${orderLink}\n\nWe encourage you to browse other services: ${servicesLink}\n\nSincerely,\nThe ${APP_NAME} Team`,
    html: `
      <p>Hello ${buyer.name || "Buyer"},</p>
      <p>We regret to inform you that your order <strong>#${order._id
        .toString()
        .slice(-6)}</strong> for "<strong>${
      service.title
    }</strong>" has been declined by the seller.</p>
      ${reasonHtml}
      <p>Your payment of <strong>$${order.totalPrice.toFixed(
        2
      )}</strong> will be automatically refunded. Please allow 3-7 business days for the refund to reflect in your account, depending on your bank.</p>
      <p><a href="${orderLink}" style="padding: 8px 12px; background-color: #6c757d; color: white; text-decoration: none; border-radius: 5px;">View Order Details</a></p>
      <p>We apologize for any inconvenience. We encourage you to <a href="${servicesLink}">browse other available services</a>.</p>
      <br/>
      <p>Sincerely,<br/>The ${APP_NAME} Team</p>
    `,
  };
};
const generateOrderAcceptedNeedSchedulingEmailForBuyer = (
  buyer,
  order,
  service
) => {
  const orderLink = `${APP_URL}/user/orders/${order._id}`; // Buyer views order to schedule
  return {
    subject: `[${APP_NAME}] Action Required: Schedule Your Accepted Order #${order._id
      .toString()
      .slice(-6)}`,
    html: `
      <p>Hello ${buyer.name || "Buyer"},</p>
      <p>Great news! The seller has accepted your order <strong>#${order._id
        .toString()
        .slice(-6)}</strong> for "<strong>${service.title}</strong>".</p>
      <p>Please proceed to schedule a time slot for your service:</p>
      <p><a href="${orderLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Schedule Your Service</a></p>
      <br/>
      <p>Thanks,<br/>The ${APP_NAME} Team</p>
    `,
    text: `... text version ...`,
  };
};

const generateOrderScheduledEmail = (
  recipient,
  order,
  service,
  isSellerView
) => {
  const scheduleInfo = order.selectedTimeSlot
    ? `Slot: ${new Date(
        order.selectedTimeSlot.slotDate
      ).toLocaleDateString()} ${order.selectedTimeSlot.startTime}-${
        order.selectedTimeSlot.endTime
      }`
    : `Time: ${new Date(order.scheduledDateTime).toLocaleString()}`;
  const orderLink = `${APP_URL}/${isSellerView ? "seller" : "user"}/orders/${
    order._id
  }`;
  const userRole = isSellerView ? "Seller" : "Buyer";

  return {
    subject: `[${APP_NAME}] Order #${order._id
      .toString()
      .slice(-6)} Scheduled!`,
    html: `
            <p>Hello ${recipient.name || userRole},</p>
            <p>Your order <strong>#${order._id
              .toString()
              .slice(-6)}</strong> for "<strong>${
      service.title
    }</strong>" has been successfully scheduled.</p>
            <p><strong>Scheduled Details:</strong> ${scheduleInfo}</p>
            <p><a href="${orderLink}" style="padding: 10px 15px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">View Order</a></p>
            <br/>
            <p>Thanks,<br/>The ${APP_NAME} Team</p>
        `,
    text: `... text version ...`,
  };
};

const newOfferReceivedEmail = (
  buyerName,
  sellerName,
  requestTitle,
  requestLink
) => {
  return {
    subject: `[SpareWork] New Offer Received for Your Request: "${requestTitle}"`,
    text: `
Hello ${buyerName || "User"},

Good news! ${sellerName} has submitted an offer for your service request: "${requestTitle}".

You can view the offer and communicate with the provider by visiting your request details page:
${requestLink}

We recommend reviewing offers promptly.

Thanks,
The SpareWork Team
    `,
    html: `
<p>Hello ${buyerName || "User"},</p>
<p>Good news! <strong>${sellerName}</strong> has submitted an offer for your service request: "<strong>${requestTitle}</strong>".</p>
<p>You can view the offer and communicate with the provider by visiting your request details page:</p>
<p><a href="${requestLink}" style="background-color: #28a745; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">View Offer</a></p>
<p>Or copy and paste this link into your browser: ${requestLink}</p>
<br/>
<p>We recommend reviewing offers promptly to engage with interested providers.</p>
<p>Thanks,<br/>The SpareWork Team</p>
    `,
  };
};

const offerAcceptedEmailToSeller = (
  sellerName,
  buyerName,
  requestTitle,
  requestLink
) => {
  return {
    subject: `[SpareWork] Congratulations! Your Offer for "${requestTitle}" Has Been Accepted!`,
    html: `
<p>Hello ${sellerName || "Service Provider"},</p>
<p>Great news! ${buyerName} has accepted your offer for the service request: "<strong>${requestTitle}</strong>".</p>
<p>Please proceed to coordinate the service delivery details. You may need to confirm or propose a schedule if applicable.</p>
<p>View the request and next steps here: <a href="${requestLink}" style="/* ... */">View Accepted Offer</a></p>
<p>Thank you for using SpareWork!<br/>The SpareWork Team</p>
    `,
    text: `...`,
  };
};

const offerRejectedEmailToSeller = (
  sellerName,
  requestTitle,
  rejectionReason
) => {
  return {
    subject: `[SpareWork] Update on Your Offer for "${requestTitle}"`,
    html: `
<p>Hello ${sellerName || "Service Provider"},</p>
<p>Regarding your offer for the service request "<strong>${requestTitle}</strong>", the buyer has decided to proceed with another option or has closed the request.</p>
${
  rejectionReason
    ? `<p><strong>Reason provided by buyer:</strong> ${rejectionReason}</p>`
    : ""
}
<p>We appreciate your time and encourage you to continue browsing other open service requests.</p>
<p>Thank you,<br/>The SpareWork Team</p>
    `,
    text: `...`,
  };
};

// *** ADD this line at the end to export using CommonJS ***
module.exports = {
  sendEmail,
  sendVerificationEmail,
  generateNewOrderEmailForSeller,
  generateOrderPaymentConfirmedEmailForBuyer,
  generateOrderAcceptedEmailForBuyer,
  generateOrderDeclinedEmailForBuyer,
  generateOrderAcceptedNeedSchedulingEmailForBuyer,
  generateOrderScheduledEmail,
  newOfferReceivedEmail,
  offerAcceptedEmailToSeller,
  offerRejectedEmailToSeller,
};
