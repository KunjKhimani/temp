// controller/order.controller.js

const mongoose = require("mongoose");
const Order = require("../model/order.model");
const ProductOrder = require("../model/productOrder.model");
const Service = require("../model/service.model");
const SpecialOffer = require("../model/specialOffer.model");
const User = require("../model/user.model");
const PaymentSplit = require("../model/paymentSplit.model");
const {
  createPaymentIntent,
  retrievePaymentIntent,
  updatePaymentIntent, // Added for updating PaymentIntent metadata
  createRefund,
  cancelPaymentIntent,
  capturePaymentIntent, // Added for capturing funds
  createTransfer, // Added for transferring funds to seller
  capturePaymentIfNeeded, // NEW: For robust payment capture
  createConnectedAccount, // NEW: For Stripe Connect accounts
  createAccountLink, // NEW: For Stripe Connect onboarding links
  confirmBackendPaymentIntent,
  getConnectedAccountStatus,
} = require("../utils/stripeService");
const { getCommissionRates, calculateDynamicCommission } = require("../utils/promotionHelper");
const Conversation = require("../model/conversation.model");
const TransactionLog = require("../model/TransactionLog.model");
const {
  createAndDispatchNotification,
} = require("../services/notification.service");
const {
  format,
  getDay: getDayFromDateFns,
  parse: parseTimeFns,
  set: setTimeFns,
  addHours: addHoursHelper,
} = require("date-fns");

// --- CREATE ORDER ---
const createOrder = async (req, res) => {
  try {
    const {
      serviceId,
      quantity,
      numberOfHours,
      numberOfPeople,
      additionalInfo,
      location,
      includeTravelFee,
      timePreference,
      selectedDate,
      selectedTimeSlot,
      schedulingComment,
      specificDateTime, // For flexible/date_range services if a specific datetime string is sent
    } = req.body;

    if (!serviceId) {
      return res.status(400).json({ message: "Service ID is required." });
    }

    const buyerId = req.user._id;
    const service = await Service.findById(serviceId)
      .populate("createdBy", "name _id email")
      .populate("specialOffer");

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }
    if (service.status !== "active") {
      return res.status(400).json({ message: "Service is not active." });
    }
    if (!service.createdBy || !service.createdBy._id) {
      return res
        .status(500)
        .json({ message: "Service creator information is missing." });
    }
    if (service.createdBy._id.toString() === buyerId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot order your own service." });
    }

    const sellerId = service.createdBy._id;
    const servicePrice = Number(service.price);

    if (isNaN(servicePrice) || servicePrice < 0) {
      return res
        .status(400)
        .json({ message: "Invalid service price defined." });
    }

    let calculatedTotalPrice = 0;
    let travelFeeAmount = 0;

    const orderDataForSave = {
      service: serviceId,
      buyer: buyerId,
      seller: sellerId,
      additionalInfo: additionalInfo || undefined,
      timePreference: timePreference || "any",
      travelFeeApplied: 0,
      quantity: 1,
      numberOfHours: undefined,
      numberOfPeople: undefined,
      location: undefined,
      schedulingComment: schedulingComment || undefined,
      selectedTimeSlot: undefined,
      scheduledDateTime: undefined,
      status: "pending-payment", // Initial status
      isSpecial: service.isSpecial,
      specialOffer: service.specialOffer?._id,
      actualPriceAtOrder: service.specialOffer?.actualPrice,
      sellingPriceAtOrder: service.specialOffer?.sellingPrice,
      isCommunity: service.isCommunity,
      subcategory: service.subcategory,
    };

    if (service.availabilityType === "scheduled_slots") {
      if (!selectedDate || !selectedTimeSlot) {
        return res.status(400).json({
          message:
            "A specific date and time slot must be selected for this service.",
        });
      }
      if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(selectedTimeSlot)) {
        return res.status(400).json({
          message: "Invalid time slot format. Expected HH:MM-HH:MM.",
        });
      }
      try {
        const [startTimeStr, endTimeStr] = selectedTimeSlot.split("-");
        const bookingDate = new Date(selectedDate);
        if (isNaN(bookingDate.getTime()))
          throw new Error("Invalid date format for selectedDate");

        const slotDateObj = setTimeFns(bookingDate, {
          hours: parseInt(startTimeStr.split(":")[0], 10),
          minutes: parseInt(startTimeStr.split(":")[1], 10),
          seconds: 0,
          milliseconds: 0,
        });

        orderDataForSave.selectedTimeSlot = {
          dayOfWeek: getDayFromDateFns(slotDateObj),
          startTime: startTimeStr,
          endTime: endTimeStr,
          slotDate: slotDateObj,
        };
      } catch (e) {
        return res.status(400).json({
          message: "Invalid date or time slot provided for scheduling.",
        });
      }
    } else if (["flexible", "date_range"].includes(service.availabilityType)) {
      if (specificDateTime) {
        try {
          const parsedSpecificDateTime = new Date(specificDateTime);
          if (isNaN(parsedSpecificDateTime.getTime()))
            throw new Error("Invalid date format for specificDateTime");
          orderDataForSave.scheduledDateTime = parsedSpecificDateTime;
        } catch (e) {
          return res.status(400).json({
            message: "Invalid date format provided for scheduling (flexible).",
          });
        }
      } else if (selectedDate) {
        try {
          const baseDate = new Date(selectedDate);
          if (isNaN(baseDate.getTime()))
            throw new Error("Invalid date format for selectedDate");
          orderDataForSave.scheduledDateTime = baseDate; // Store date, seller refines time based on timePreference
        } catch (e) {
          return res
            .status(400)
            .json({ message: "Invalid date format provided (flexible)." });
        }
      }
    }

    if (
      service.type === "on-site" &&
      service.travelFee &&
      service.travelFee > 0
    ) {
      travelFeeAmount = Number(service.travelFee);
    }

    if (service.priceType === "per hour") {
      const numHours = Number(numberOfHours);
      const numQuantity = Number(quantity) || 1;
      if (isNaN(numHours) || numHours < 0.1)
        return res
          .status(400)
          .json({ message: "Valid number of hours (>= 0.1) required." });
      if (isNaN(numQuantity) || numQuantity < 1)
        return res
          .status(400)
          .json({ message: "Valid quantity (>= 1) required." });
      orderDataForSave.numberOfHours = numHours;
      orderDataForSave.quantity = numQuantity;

      if (service.type === "on-site") {
        const numPeople = Number(numberOfPeople) || 1;
        if (isNaN(numPeople) || numPeople < 1)
          return res.status(400).json({
            message: "Valid number of people (>= 1) required for on-site.",
          });
        calculatedTotalPrice =
          servicePrice * numHours * numPeople * numQuantity;
        orderDataForSave.numberOfPeople = numPeople;
        if (
          service.locations?.length > 0 &&
          (!location || typeof location !== "string" || location.trim() === "")
        ) {
          return res.status(400).json({
            message: "Location is required for this on-site service.",
          });
        }
        if (location) orderDataForSave.location = location.trim();
      } else {
        calculatedTotalPrice = servicePrice * numHours * numQuantity;
      }
    } else if (service.priceType === "per project") {
      const numQuantity = Number(quantity) || 1;
      if (isNaN(numQuantity) || numQuantity < 1)
        return res
          .status(400)
          .json({ message: "Valid quantity (>= 1) required." });
      orderDataForSave.quantity = numQuantity;

      if (service.type === "on-site") {
        const numPeople = Number(numberOfPeople) || 1;
        if (isNaN(numPeople) || numPeople < 1)
          return res.status(400).json({
            message: "Valid number of people (>= 1) required for on-site.",
          });
        calculatedTotalPrice = servicePrice * numPeople * numQuantity;
        orderDataForSave.numberOfPeople = numPeople;
        if (
          service.locations?.length > 0 &&
          (!location || typeof location !== "string" || location.trim() === "")
        ) {
          return res.status(400).json({
            message: "Location is required for this on-site service.",
          });
        }
        if (location) orderDataForSave.location = location.trim();
      } else {
        calculatedTotalPrice = servicePrice * numQuantity;
      }
    } else {
      return res
        .status(500)
        .json({ message: "Service has an invalid price type configuration." });
    }

    if (service.type === "on-site") {
      orderDataForSave.quantity = 1; // Default for on-site as form field might be hidden
    }

    if (
      service.type === "on-site" &&
      travelFeeAmount > 0 &&
      includeTravelFee === true
    ) {
      calculatedTotalPrice += travelFeeAmount;
      orderDataForSave.travelFeeApplied = travelFeeAmount;
    }

    const minimumAmount = 0.5;
    if (calculatedTotalPrice < minimumAmount) {
      return res.status(400).json({
        message: `Total price must be at least $${minimumAmount.toFixed(2)}.`,
      });
    }
    orderDataForSave.totalPrice = calculatedTotalPrice;

    // Generate a new ObjectId for the order upfront
    const newOrderId = new mongoose.Types.ObjectId();
    orderDataForSave._id = newOrderId; // Assign the generated ID

    // Create the payment intent BEFORE saving the order, using the generated ID
    const amountForStripe = Math.round(calculatedTotalPrice * 100);
    const stripeMetadata = {
      order_id: newOrderId.toString(), // Use the generated ID here
      order_payload_serviceId: serviceId.toString(),
      order_payload_buyerId: buyerId.toString(),
      order_payload_sellerId: sellerId.toString(),
    };
    const stripeDescription = `Order for service: ${service.title}`;

    const stripeResponse = await createPaymentIntent(
      amountForStripe,
      "usd",
      stripeMetadata,
      stripeDescription
    );

    if (!stripeResponse.success || !stripeResponse.paymentIntent?.id) {
      return res.status(500).json({
        message: stripeResponse.message || "Failed to initialize payment.",
      });
    }

    // Now create the order object with payment intent details
    orderDataForSave.paymentIntentId = stripeResponse.paymentIntent.id;
    orderDataForSave.paymentIntentClientSecret =
      stripeResponse.paymentIntent.client_secret;

    const order = new Order(orderDataForSave);

    // Save the order for the first time
    const savedOrder = await order.save();

    // Create transaction log for order attempt
    try {
      await TransactionLog.create({
        buyer: savedOrder.buyer,
        seller: savedOrder.seller,
        type: "service",
        purchasedItem: savedOrder._id,
        itemModel: "Order",
        totalAmount: savedOrder.totalPrice,
        sellerCommission: 0, // Will be calculated on payment confirmation
        adminCommission: 0, // Will be calculated on payment confirmation
        status: "pending", // Order is pending payment
        paymentProvider: "stripe",
        transactionId: savedOrder.paymentIntentId,
        isSpecial: savedOrder.isSpecial,
        specialOffer: savedOrder.specialOffer,
        isCommunity: savedOrder.isCommunity,
        metadata: {
          orderAttempt: true,
          orderStatus: savedOrder.status
        }
      });
      console.log(`[createOrder] TransactionLog created for order attempt ${savedOrder._id}`);
    } catch (logError) {
      console.error(`[createOrder] Failed to create TransactionLog:`, logError);
    }

    // Optionally, update the Payment Intent's metadata with the confirmed order ID
    // (though it's already set with the generated ID, this is for robustness if IDs could change)
    await updatePaymentIntent(savedOrder.paymentIntentId, {
      metadata: {
        order_id: savedOrder._id.toString(), // Ensure it's the final saved ID
      },
    });

    // You should re-populate the savedOrder to send a full response
    const responseOrder = {
      _id: savedOrder._id,
      service: {
        _id: service._id,
        title: service.title,
        price: service.price,
        priceType: service.priceType,
        type: service.type,
      },
      quantity: savedOrder.quantity,
      numberOfHours: savedOrder.numberOfHours,
      numberOfPeople: savedOrder.numberOfPeople,
      location: savedOrder.location,
      additionalInfo: savedOrder.additionalInfo,
      timePreference: savedOrder.timePreference,
      selectedTimeSlot: savedOrder.selectedTimeSlot
        ? {
          startTime: savedOrder.selectedTimeSlot.startTime,
          endTime: savedOrder.selectedTimeSlot.endTime,
          slotDate: savedOrder.selectedTimeSlot.slotDate
            ? savedOrder.selectedTimeSlot.slotDate.toISOString()
            : undefined,
        }
        : undefined,
      scheduledDateTime: savedOrder.scheduledDateTime
        ? savedOrder.scheduledDateTime.toISOString()
        : undefined,
      schedulingComment: savedOrder.schedulingComment,
      travelFeeApplied: savedOrder.travelFeeApplied,
      totalPrice: savedOrder.totalPrice,
      status: savedOrder.status,
      createdAt: savedOrder.createdAt,
      buyer: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      paymentIntentId: savedOrder.paymentIntentId,
    };

    res.status(201).json({
      message: "Order created successfully. Please proceed to payment.",
      order: responseOrder,
      clientSecret: stripeResponse.paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error in createOrder:", error);
    if (
      error.type === "StripeCardError" ||
      error.type === "StripeInvalidRequestError"
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((el) => el.message);
      return res.status(400).json({
        message: messages.join(". ") || "Order validation failed.",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Internal Server Error creating order." });
  }
};

// --- CONFIRM PAYMENT ---
const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentIntentId, sourceId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res
        .status(400)
        .json({ message: "PaymentIntent ID and Order ID are required" });
    }

    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id") // Ensure _id is selected for comparisons
      .populate("seller", "name email pushTokens _id") // Ensure _id is selected
      .populate("service", "title isCommunity subcategory");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Re-vivify pending intent if it's missing from memory (e.g. after server restart)
    if (paymentIntentId && paymentIntentId.startsWith("pending_")) {
      const { repopulatePendingIntent } = require("../utils/stripeService");
      repopulatePendingIntent({
        id: paymentIntentId,
        amount: order.totalPrice * 100,
        currency: "usd",
        metadata: { order_id: order._id.toString() },
        description: `Order for service: ${order.service?.title || orderId}`,
      });
    }

    if (order.buyer._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to confirm this payment" });
    }

    let paymentIntent = null;
    let success = false;
    let stripeMessage = null;

    if (sourceId) {
      const confirmResult = await confirmBackendPaymentIntent(
        paymentIntentId,
        sourceId
      );
      success = confirmResult.success;
      paymentIntent = confirmResult.paymentIntent;
      stripeMessage = confirmResult.message;
      if (success && paymentIntent?.id) {
        order.paymentIntentId = paymentIntent.id;
        await order.save();
      }
    } else {
      const retrieveResult = await retrievePaymentIntent(paymentIntentId);
      success = retrieveResult.success;
      paymentIntent = retrieveResult.paymentIntent;
      stripeMessage = retrieveResult.message;
    }

    if (!success) {
      console.error(
        `[confirmPayment] PaymentIntent retrieval failed for PI ${paymentIntentId}: ${stripeMessage}`
      );
      // If Stripe retrieval itself fails, mark order as failed and return 400
      order.status = "failed";
      await order.save();
      
      // Create transaction log for payment failure
      try {
        await TransactionLog.findOneAndUpdate(
          { 
            purchasedItem: order._id,
            itemModel: "Order",
            status: "pending"
          },
          {
            status: "failed",
            $set: {
              "metadata.paymentFailed": true,
              "metadata.failedAt": new Date(),
              "metadata.failureReason": stripeMessage || "Payment retrieval/confirmation failed"
            }
          },
          { new: true }
        );
        console.log(`[confirmPayment] TransactionLog updated for payment failure ${order._id}`);
      } catch (logError) {
        console.error(`[confirmPayment] Failed to update TransactionLog for payment failure:`, logError);
      }
      
      return res.status(400).json({
        message: stripeMessage || "Payment retrieval/confirmation failed",
      });
    }

    console.log(
      `[confirmPayment] Order ID: ${orderId}, Current Status (before update): ${order.status}`
    );
    console.log(
      `[confirmPayment] PaymentIntent status for PI ${paymentIntentId}: ${paymentIntent.status}`
    );

    // Define statuses that indicate a successful or pending-capture payment
    const successfulOrPendingCaptureStatuses = [
      "succeeded",
      "requires_capture",
    ];

    if (successfulOrPendingCaptureStatuses.includes(paymentIntent.status)) {
      // PaymentIntent succeeded or is authorized and requires capture.
      // The final order status update (to 'completed') and fund transfer
      // will be handled by the Stripe webhook (payment_intent.succeeded event).
      // This endpoint just confirms the client-side payment status and ensures
      // the order is not marked as 'failed' prematurely.

      // Only update order status if it's currently 'failed' or 'pending-payment'
      // If it's 'awaiting-seller-confirmation', keep it that way.
      if (order.status === "failed") {
        order.status = "pending-payment"; // Revert from failed if PI is good
        console.log(
          `[confirmPayment] Order ${orderId} status reverted from 'failed' to 'pending-payment' based on PI status.`
        );
      }

      if (order.status === "pending-payment") {
        order.status = "awaiting-seller-confirmation";
        await order.save();
        console.log(
          `Order ${orderId} status updated to awaiting-seller-confirmation`
        );

        // Calculate commission using centralized dynamic logic
        const { adminCommission, sellerCommission: sellerIncome, level } = await calculateDynamicCommission(
          order.totalPrice,
          order,
          "service"
        );

        // Update existing transaction log
        try {
          await TransactionLog.findOneAndUpdate(
            { 
              purchasedItem: order._id,
              itemModel: "Order",
              status: "pending"
            },
            {
              sellerCommission: sellerIncome,
              adminCommission: adminCommission,
              status: "completed",
              paymentProvider: "square",
              transactionId: paymentIntent.id,
              isCommunity: level === 'community',
              $unset: {
                "metadata.orderAttempt": "",
                "metadata.orderStatus": ""
              },
              $set: {
                "metadata.paymentConfirmed": true,
                "metadata.confirmedAt": new Date()
              }
            },
            { new: true }
          );
          console.log(`[confirmPayment] TransactionLog updated for order ${order._id}`);
        } catch (logError) {
          console.error(`[confirmPayment] Failed to update TransactionLog:`, logError);
          // Fallback: create new transaction log if update fails
          try {
            await TransactionLog.findOneAndUpdate(
              {
                purchasedItem: order._id,
                itemModel: "Order",
                status: "pending"
              },
              {
                $set: {
                  buyer: order.buyer._id,
                  seller: order.seller._id,
                  type: "service",
                  totalAmount: order.totalPrice,
                  sellerCommission: sellerIncome,
                  adminCommission: adminCommission,
                  status: "completed",
                  paymentProvider: "square",
                  transactionId: paymentIntent.id,
                  isSpecial: order.isSpecial,
                  specialOffer: order.specialOffer,
                }
              },
              { upsert: true, new: true }
            );
            console.log(`[confirmPayment] Fallback TransactionLog created for order ${order._id}`);
          } catch (fallbackError) {
            console.error(`[confirmPayment] Failed to create fallback TransactionLog:`, fallbackError);
          }
        }

        // NEW: Notify seller about the new order awaiting confirmation
        const io = req.app.get("socketio");
        const serviceTitle = order.service?.title || "a service";
        const orderDisplayId = order._id.toString().slice(-6);
        const commonLink = `/user/orders/${order._id}`;

        if (order.seller?._id) {
          createAndDispatchNotification({
            recipientId: order.seller._id,
            senderId: order.buyer._id,
            type: "NEW_ORDER_PENDING_CONFIRMATION_SELLER", // Define this type in your NotificationSchema
            title: "New Order Awaiting Your Confirmation!",
            message: `You have a new order (#${orderDisplayId}) for "${serviceTitle}" awaiting your review and confirmation.`,
            link: commonLink,
            relatedResource: order._id,
            relatedResourceType: "Order",
            io,
          }).catch((err) =>
            console.error(
              "Error notifying seller about new order awaiting confirmation:",
              err
            )
          );
        }
        // Also update sockets for both buyer and seller with the new status
        if (io) {
          const eventData = {
            orderId: order._id,
            status: order.status,
            order: order,
          };
          io.to(order.buyer._id.toString()).emit(
            "order_status_updated",
            eventData
          );
          io.to(order.seller._id.toString()).emit(
            "order_status_updated",
            eventData
          );
        }
      } else if (order.status === "awaiting-seller-confirmation") {
        // Keep as awaiting-seller-confirmation, webhook will finalize
        console.log(
          `[confirmPayment] Order ${orderId} remains 'awaiting-seller-confirmation'.`
        );
      }
      // If order status is already 'succeeded' or 'completed' (unlikely to hit this endpoint then), do nothing.

      // After a successful or pending-capture payment, record expected admin share
      // into the PaymentSplit collection for audit/demo purposes.
      try {
        const totalAmount = Number(order.totalPrice || 0);
        const { adminCommission: adminAmountExpected, sellerCommission: sellerAmountExpected } = await calculateDynamicCommission(
          totalAmount,
          order,
          "service"
        );

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
          console.warn(
            `[confirmPayment][PaymentSplit] Skipping PaymentSplit save for order ${orderId} due to invalid totalAmount:`,
            order.totalPrice
          );
        } else {

          console.log(
            `[confirmPayment][PaymentSplit] Order ${orderId} totalAmount=$${totalAmount.toFixed(
              2
            )}, expected admin fixed=$${adminAmountExpected.toFixed(
              2
            )}, seller gets remaining=$${sellerAmountExpected.toFixed(
              2
            )}. Saving to PaymentSplit.`
          );

          await PaymentSplit.findOneAndUpdate(
            {
              orderType: "service_order",
              orderId: order._id,
            },
            {
              $set: {
                buyer: order.buyer?._id,
                seller: order.seller?._id,
                totalAmount,
                currency: "USD",
                // For a fixed admin fee, platformFeePercent is not constant; set 0 for clarity
                platformFeePercent: 0,
                adminAmountExpected,
                sellerAmountExpected,
                // At confirm-payment time we only record expected split; actual transfer
                // and isSplitApplied=true are handled later in markOrderCompleted.
                isSplitApplied: false,
                paymentProvider: "stripe",
                paymentReferenceId: paymentIntent.id,
                notes:
                  "Saved from confirmPayment for audit/demo. Expected 80/20 split before final transfer.",
                snapshot: {
                  paymentIntentStatus: paymentIntent.status,
                  createdFrom: "confirmPayment",
                },
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          console.log(
            `[confirmPayment][PaymentSplit] PaymentSplit saved/upserted for service order ${order._id}.`
          );
        }
      } catch (splitError) {
        console.error(
          `[confirmPayment][PaymentSplit] Failed to save PaymentSplit for service order ${orderId}:`,
          splitError.message,
          splitError.stack
        );
      }

      // Retrieve the order to send back the current state to the client
      const currentOrder = await Order.findById(orderId)
        .populate("buyer")
        .populate("seller")
        .populate("service");

      return res.status(200).json({
        message: "Payment confirmed. Processing will continue via webhooks.",
        order: currentOrder,
        paymentIntentStatus: paymentIntent.status,
      });
    } else {
      // If paymentIntent is not in a successful or pending-capture state, update order status to failed
      console.warn(
        `[confirmPayment] PaymentIntent status '${paymentIntent.status}' for PI ${paymentIntentId} is not successful or pending capture. Marking order ${orderId} as 'failed'.`
      );
      order.status = "failed";
      await order.save();
      
      // Create transaction log for payment intent status failure
      try {
        await TransactionLog.findOneAndUpdate(
          { 
            purchasedItem: order._id,
            itemModel: "Order",
            status: "pending"
          },
          {
            status: "failed",
            $set: {
              "metadata.paymentFailed": true,
              "metadata.failedAt": new Date(),
              "metadata.failureReason": `PaymentIntent status: ${paymentIntent.status}`,
              "metadata.paymentIntentStatus": paymentIntent.status
            }
          },
          { new: true }
        );
        console.log(`[confirmPayment] TransactionLog updated for payment intent failure ${order._id}`);
      } catch (logError) {
        console.error(`[confirmPayment] Failed to update TransactionLog for payment intent failure:`, logError);
      }
    }
  } catch (error) {
    console.error(
      `Error in confirmPayment for Order ID: ${req.params?.orderId}:`,
      error.message,
      error.stack
    );
    if (error.name === "ValidationError")
      return res.status(400).json({ message: error.message });
    res
      .status(500)
      .json({ message: "Internal Server Error confirming payment." });
  }
};

// --- ACCEPT ORDER (Seller Action) ---
const acceptOrder = async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user._id;

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id")
      .populate("service", "title availabilityType");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (order.seller._id.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to accept this order." });
    }
    if (order.status !== "awaiting-seller-confirmation") {
      return res.status(400).json({
        message: `Order is not awaiting confirmation. Status: ${order.status}`,
      });
    }

    let nextStatus;
    let buyerNotificationMessage;
    let sellerNotificationMessageContinuation;
    const serviceTitleForNotif = order.service?.title || "a service";
    const orderDisplayIdForNotif = orderId.slice(-6);

    const isScheduledUpfront =
      (order.service?.availabilityType === "scheduled_slots" &&
        order.selectedTimeSlot &&
        order.selectedTimeSlot.slotDate) ||
      ((order.service?.availabilityType === "flexible" ||
        order.service?.availabilityType === "date_range") &&
        order.scheduledDateTime);

    if (isScheduledUpfront) {
      nextStatus = "in-progress";
      buyerNotificationMessage = `Order (#${orderDisplayIdForNotif}) for "${serviceTitleForNotif}" accepted and is now in progress.`;
      sellerNotificationMessageContinuation = "Order is now in progress.";
    } else if (
      order.service?.availabilityType === "scheduled_slots" ||
      order.service?.availabilityType === "date_range"
    ) {
      nextStatus = "awaiting-buyer-scheduling";
      buyerNotificationMessage = `Order (#${orderDisplayIdForNotif}) for "${serviceTitleForNotif}" accepted. Please schedule a time.`;
      sellerNotificationMessageContinuation = "Awaiting buyer to schedule.";
    } else {
      nextStatus = "accepted"; // Or "in-progress"
      buyerNotificationMessage = `Order (#${orderDisplayIdForNotif}) for "${serviceTitleForNotif}" accepted by seller.`;
      sellerNotificationMessageContinuation = "Ready to proceed.";
      // If defaulting non-schedulable to in-progress:
      // nextStatus = "in-progress";
      // buyerNotificationMessage = `Order (#${orderDisplayIdForNotif}) for "${serviceTitleForNotif}" accepted and is now in progress.`;
      // sellerNotificationMessageContinuation = "Order is now in progress.";
    }

    order.status = nextStatus;
    order.sellerActionTimestamp = new Date();
    const savedOrder = await order.save();
    const io = req.app.get("socketio");

    if (savedOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedOrder.buyer._id,
        senderId: savedOrder.seller._id,
        type: "ORDER_ACCEPTED_BUYER",
        title: "Order Update!",
        message: buyerNotificationMessage,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error("Err sending order accepted (buyer):", err)
      );
    }

    createAndDispatchNotification({
      recipientId: savedOrder.seller._id,
      type: "ORDER_ACCEPTED_SELLER",
      title: "Order Accepted",
      message: `You accepted order (#${orderDisplayIdForNotif}). ${sellerNotificationMessageContinuation}`,
      link: `/user/orders/${savedOrder._id}`,
      relatedResource: savedOrder._id,
      relatedResourceType: "Order",
      io,
    }).catch((err) =>
      console.error("Err sending order accepted (seller):", err)
    );

    const conversation = await Conversation.findOneAndUpdate(
      { orderId: savedOrder._id },
      {
        $set: {
          lastMessage: `Order status: ${nextStatus}. ${sellerNotificationMessageContinuation}`,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).populate("sellerId buyerId", "name");

    if (conversation && io) {
      const eventData = {
        ...conversation.toObject(),
        orderStatus: savedOrder.status,
        orderId: savedOrder._id,
      };
      io.to(savedOrder.buyer._id.toString()).emit(
        "conversationUpdated",
        eventData
      );
      io.to(savedOrder.seller._id.toString()).emit(
        "conversationUpdated",
        eventData
      );
      const orderUpdateEventData = {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder.toObject({ depopulate: true }), // Send lean object for socket
      };
      io.to(savedOrder.buyer._id.toString()).emit(
        "order_status_updated",
        orderUpdateEventData
      );
      io.to(savedOrder.seller._id.toString()).emit(
        "order_status_updated",
        orderUpdateEventData
      );
    }

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate(
        "service buyer seller",
        "title name email profilePicture availabilityType companyName representativeName accountType"
      )
      .lean();
    res.status(200).json({
      message: `Order accepted. Status: ${nextStatus}.`,
      order: populatedOrder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error while accepting order." });
  }
};

// --- SELLER PROPOSES TIME CHANGE ---
const proposeTimeChange = async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user._id;
  const { proposedTimePreferences, sellerMessage } = req.body; // Array of strings, and a message

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id stripeAccountId") // Populate stripeAccountId
      .populate("service", "title");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (order.seller._id.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized for this action." });
    }
    if (order.status !== "awaiting-seller-confirmation") {
      return res.status(400).json({
        message: `Order status (${order.status}) does not allow proposing time changes.`,
      });
    }
    if (
      !Array.isArray(proposedTimePreferences) ||
      proposedTimePreferences.length === 0
    ) {
      return res.status(400).json({
        message: "At least one proposed time preference is required.",
      });
    }
    // Optional: Validate proposedTimePreferences against enum values

    order.sellerProposedTimePreferences = proposedTimePreferences;
    order.sellerTimeProposalMessage = sellerMessage || undefined;
    order.status = "awaiting-buyer-time-adjustment";
    order.sellerActionTimestamp = new Date();

    const savedOrder = await order.save();
    const io = req.app.get("socketio");

    // Notification to Buyer
    if (savedOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedOrder.buyer._id,
        senderId: savedOrder.seller._id,
        type: "ORDER_TIME_PROPOSAL_BUYER",
        title: "Time Change Proposed",
        message: `${
            savedOrder.seller.name || "The seller"
          } has proposed alternative times for your order (#${orderId.slice(
            -6
          )}) for "${order.service.title}". Please review.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
        // emailTemplateFunc: 'generateTimeProposalEmailForBuyer', // Create this template
        // emailTemplateArgs: [savedOrder.buyer, savedOrder, savedOrder.service, proposedTimePreferences, sellerMessage],
      }).catch((err) =>
        console.error("Notify buyer (time proposal) err:", err)
      );
    }

    // Update Conversation
    if (savedOrder.seller?._id && savedOrder.buyer?._id && io) {
      const conversationMessage = `Seller proposed new time options: ${proposedTimePreferences.join(
        ", "
      )}. ${sellerMessage || ""}`;
      // Find or update conversation associated with this order
      await Conversation.findOneAndUpdate(
        { orderId: savedOrder._id },
        { $set: { lastMessage: conversationMessage, updatedAt: new Date() } },
        { new: true, upsert: false } // Assuming conversation exists
      ).then((convo) => {
        if (convo) {
          const eventData = {
            ...convo.toObject(),
            orderStatus: savedOrder.status,
            orderId: savedOrder._id,
          };
          io.to(savedOrder.buyer._id.toString()).emit(
            "conversationUpdated",
            eventData
          );
          io.to(savedOrder.seller._id.toString()).emit(
            "conversationUpdated",
            eventData
          );
        }
      });
      io.to(savedOrder.buyer._id.toString()).emit("order_status_updated", {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder.toObject({ depopulate: true }),
      });
      io.to(savedOrder.seller._id.toString()).emit("order_status_updated", {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder.toObject({ depopulate: true }),
      });
    }

    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "service buyer seller",
      "title name email profilePicture companyName representativeName accountType"
    ); // Add necessary fields

    res.status(200).json({
      message: "Time change proposal submitted. Awaiting buyer response.",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      `Error proposing time change for order ${orderId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error while proposing time change." });
  }
};

// --- BUYER RESPONDS TO TIME CHANGE PROPOSAL ---
const confirmTimeProposal = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user._id;
  const { acceptedTimePreference } = req.body;

  console.log(
    `[confirmTimeProposal] Order ID: ${orderId}, Buyer ID: ${buyerId}`
  );
  console.log(
    "[confirmTimeProposal] Received acceptedTimePreference:",
    acceptedTimePreference
  );

  try {
    const order = await Order.findById(orderId); // Fetch without .lean() to modify and save

    if (!order) {
      console.log(`[confirmTimeProposal] Order not found: ${orderId}`);
      return res.status(404).json({ message: "Order not found." });
    }
    if (order.buyer.toString() !== buyerId.toString()) {
      console.log(
        `[confirmTimeProposal] Unauthorized attempt by user ${buyerId} for order ${orderId}`
      );
      return res
        .status(403)
        .json({ message: "Not authorized for this action." });
    }
    if (order.status !== "awaiting-buyer-time-adjustment") {
      console.warn(
        `[confirmTimeProposal] Attempt to confirm proposal for order ${orderId} but its status is '${order.status}', not 'awaiting-buyer-time-adjustment'. This might be a stale request or UI issue.`
      );
      return res.status(400).json({
        message: `This action cannot be performed. The order is currently in '${order.status}' status. Expected 'awaiting-buyer-time-adjustment'.`,
        currentStatus: order.status, // Send current status back for debugging
      });
    }
    if (
      !order.sellerProposedTimePreferences ||
      !order.sellerProposedTimePreferences.includes(acceptedTimePreference)
    ) {
      console.log(
        `[confirmTimeProposal] Invalid acceptedTimePreference for order ${orderId}:`,
        acceptedTimePreference
      );
      return res.status(400).json({
        message:
          "The accepted time preference was not one of the seller's proposals or proposals are missing.",
      });
    }

    order.timePreference = acceptedTimePreference;
    order.status = "awaiting-seller-confirmation"; // Back to seller to formally accept the order
    order.buyerActionTimestamp = new Date();
    // Optionally clear seller's proposal fields now that buyer has responded
    // order.sellerProposedTimePreferences = undefined; // Or []
    // order.sellerTimeProposalMessage = undefined;

    const savedOrder = await order.save();

    // --- Log what was saved ---
    console.log("--- [confirmTimeProposal] Order fields AFTER SAVE ---");
    console.log("savedOrder.status:", savedOrder.status);
    console.log(
      "savedOrder.timePreference (updated):",
      savedOrder.timePreference
    );
    console.log("--- End [confirmTimeProposal] Order fields AFTER SAVE ---");

    // --- IMPORTANT: Fetch the fully populated version for the response ---
    const populatedOrderForResponse = await Order.findById(savedOrder._id) // Define it here
      .populate(
        "service",
        "title price priceType type media category subcategory createdBy availabilityType availableTimeSlots availabilityInfo"
      )
      .populate(
        "buyer",
        "name email profilePicture accountType companyName representativeName pushTokens _id"
      )
      .populate(
        "seller",
        "name email profilePicture accountType companyName representativeName pushTokens _id"
      )
      .lean();

    // --- Log what is being sent in the response ---
    console.log(
      "--- [confirmTimeProposal] RESPONSE TO CLIENT (populatedOrderForResponse) ---"
    );
    console.log(JSON.stringify(populatedOrderForResponse, null, 2));
    console.log("--- End [confirmTimeProposal] RESPONSE TO CLIENT ---");

    const io = req.app.get("socketio");
    // Notification to Seller
    if (
      populatedOrderForResponse.seller?._id &&
      populatedOrderForResponse.buyer?._id
    ) {
      createAndDispatchNotification({
        recipientId: populatedOrderForResponse.seller._id,
        senderId: populatedOrderForResponse.buyer._id,
        type: "ORDER_TIME_PROPOSAL_ACCEPTED_SELLER",
        title: "Time Preference Updated by Buyer",
        message: `${
            populatedOrderForResponse.buyer.name || "The buyer"
          } has updated their time preference to ${getTimePreferenceDisplay(
            acceptedTimePreference
          )} for order (#${orderId.slice(
            -6
          )}) based on your proposal. Please review and confirm the order.`,
        link: `/user/orders/${populatedOrderForResponse._id}`,
        relatedResource: populatedOrderForResponse._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error(
          "[confirmTimeProposal] Notify seller (time proposal accepted) err:",
          err
        )
      );
    }

    // Update Conversation
    if (
      populatedOrderForResponse.seller?._id &&
      populatedOrderForResponse.buyer?._id &&
      io
    ) {
      const conversationMessage = `Buyer accepted new time preference: ${getTimePreferenceDisplay(
        acceptedTimePreference
      )}. Awaiting your final confirmation.`;
      await Conversation.findOneAndUpdate(
        { orderId: populatedOrderForResponse._id },
        {
          $set: {
            lastMessage: conversationMessage,
            updatedAt: new Date() /* Consider readBy */,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true } // upsert might be needed if convo wasn't created yet
      )
        .then((convo) => {
          if (convo) {
            const eventData = {
              ...convo.toObject(),
              orderStatus: populatedOrderForResponse.status,
              orderId: populatedOrderForResponse._id,
            };
            io.to(populatedOrderForResponse.buyer._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
            io.to(populatedOrderForResponse.seller._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
          }
        })
        .catch((err) =>
          console.error("[confirmTimeProposal] Conversation update err:", err)
        );

      const orderUpdatePayload = {
        orderId: populatedOrderForResponse._id,
        status: populatedOrderForResponse.status,
        order: populatedOrderForResponse,
      };
      io.to(populatedOrderForResponse.buyer._id.toString()).emit(
        "order_status_updated",
        orderUpdatePayload
      );
      io.to(populatedOrderForResponse.seller._id.toString()).emit(
        "order_status_updated",
        orderUpdatePayload
      );
    }

    res.status(200).json({
      message: "Time preference updated. Awaiting seller's final confirmation.",
      order: populatedOrderForResponse, // Send the populated order
    });
  } catch (error) {
    console.error(
      `[confirmTimeProposal] Error for order ${orderId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error confirming time proposal." });
  }
};

// Helper function (can be moved to a utils file if used elsewhere)
const getTimePreferenceDisplay = (preference) => {
  switch (preference) {
    case "morning":
      return "Morning (e.g., 9 AM - 12 PM)";
    case "afternoon":
      return "Afternoon (e.g., 1 PM - 5 PM)";
    case "evening":
      return "Evening (e.g., 6 PM - 9 PM)";
    case "any":
    default:
      return "Any Time";
  }
};

// --- DECLINE ORDER (Seller Action) ---
const declineOrder = async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const sellerId = req.user._id;

  console.log(
    `[declineOrder] Seller ${sellerId} attempting to decline order ${orderId} with reason: "${reason}"`
  );

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id")
      .populate("service", "title");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (!order.seller || order.seller._id.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to decline this order." });
    }
    if (order.status !== "awaiting-seller-confirmation") {
      return res.status(400).json({
        message: `Order cannot be declined from status: ${order.status}`,
      });
    }

    order.status = "seller-declined-awaiting-buyer";
    order.sellerActionTimestamp = new Date();
    order.declineReason = reason || "Seller declined the order.";

    const savedOrder = await order.save();
    const io = req.app.get("socketio");

    console.log(
      `[declineOrder] Order ${orderId} status to ${savedOrder.status}. Reason: "${savedOrder.declineReason}"`
    );

    const serviceTitle = savedOrder.service?.title || "a service";
    const orderDisplayId = savedOrder._id.toString().slice(-6);

    if (savedOrder.buyer?._id && savedOrder.seller?._id) {
      createAndDispatchNotification({
        recipientId: savedOrder.buyer._id,
        senderId: savedOrder.seller._id,
        type: "ORDER_SELLER_DECLINED_BUYER_CHOICE", // ENSURE THIS IS IN NotificationSchema
        title: "Order Declined by Seller",
        message: `Order (#${orderDisplayId}) for "${serviceTitle}" was declined. Reason: "${savedOrder.declineReason}". Please review your options.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) => console.error("[declineOrder] Notify buyer err:", err));

      createAndDispatchNotification({
        recipientId: savedOrder.seller._id,
        type: "ORDER_DECLINED_BY_YOU_SELLER", // ENSURE THIS IS IN NotificationSchema
        title: "Order Declined",
        message: `You declined order (#${orderDisplayId}). Buyer notified.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error("[declineOrder] Notify seller (self) err:", err)
      );
    }

    if (savedOrder.seller?._id && savedOrder.buyer?._id && io) {
      const conversationMessage = `Seller declined order (#${orderDisplayId}). Reason: ${savedOrder.declineReason}. Buyer is reviewing options.`;
      const customConversationId = [
        savedOrder.buyer._id.toString(),
        savedOrder.seller._id.toString(),
      ]
        .sort()
        .join("_");
      await Conversation.findOneAndUpdate(
        { id: customConversationId },
        {
          $set: {
            lastMessage: conversationMessage,
            updatedAt: new Date(),
            orderId: savedOrder._id,
          },
          $setOnInsert: {
            id: customConversationId,
            buyerId: savedOrder.buyer._id,
            sellerId: savedOrder.seller._id,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
        .then((convo) => {
          if (convo) {
            const eventData = {
              ...convo.toObject(),
              orderStatus: savedOrder.status,
              orderId: savedOrder._id,
            };
            io.to(savedOrder.buyer._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
            io.to(savedOrder.seller._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
          }
        })
        .catch((err) =>
          console.error("[declineOrder] Conversation update err:", err)
        );

      const orderUpdatePayload = {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder.toObject({ depopulate: true }),
      };
      io.to(savedOrder.buyer._id.toString()).emit(
        "order_status_updated",
        orderUpdatePayload
      );
      io.to(savedOrder.seller._id.toString()).emit(
        "order_status_updated",
        orderUpdatePayload
      );
    }

    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "service buyer seller"
    );
    res.status(200).json({
      message: "Order declined. Buyer notified to choose next step.",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      `[declineOrder] Error order ${req.params?.orderId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error while declining order." });
  }
};

// Helper to convert "HH:mm" to a comparable number (e.g., total minutes or just HHMM)
const timeStringToNumeric = (timeStr) => {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 100 + minutes; // e.g., "09:30" -> 930, "17:00" -> 1700
};

// --- BUYER SCHEDULES OR RESCHEDULES ORDER SLOT ---
const scheduleOrderSlot = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user._id; // Assuming req.user is populated by authMiddleware
  const { scheduleData, isReschedule } = req.body;

  if (!scheduleData) {
    return res
      .status(400)
      .json({ message: "scheduleData is missing from the request body." });
  }

  const {
    selectedSlotForDb, // For "scheduled_slots", contains specific chosen {dayOfWeek, startTime, endTime}
    specificDateForSlot, // For "scheduled_slots", ISO string of the actual start date & time
    specificDateTime, // For "flexible" or "date_range", ISO string of the chosen date & time
    buyerSchedulingComment,
  } = scheduleData;

  console.log(
    `[scheduleOrderSlot] Order ID: ${orderId}, Buyer ID: ${buyerId}, isReschedule: ${isReschedule}`
  );
  console.log(
    "[scheduleOrderSlot] Effective schedulePayload (scheduleData):",
    JSON.stringify(scheduleData, null, 2)
  );

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id") // Populate fields needed for notifications
      .populate("seller", "name email pushTokens _id")
      .populate(
        "service",
        "title availabilityType availableTimeSlots availabilityInfo numberOfHours"
      ); // Include numberOfHours from service if it's defined there

    if (!order) {
      console.log(`[scheduleOrderSlot] Order not found: ${orderId}`);
      return res.status(404).json({ message: "Order not found." });
    }
    if (order.buyer._id.toString() !== buyerId.toString()) {
      console.log(
        `[scheduleOrderSlot] Unauthorized attempt by user ${buyerId} for order ${orderId}`
      );
      return res
        .status(403)
        .json({ message: "Not authorized to schedule/reschedule this order." });
    }
    if (!order.service) {
      console.log(
        `[scheduleOrderSlot] Service details missing for order ${orderId}`
      );
      return res
        .status(400)
        .json({ message: "Service details missing for scheduling." });
    }

    // Status Check
    if (isReschedule) {
      // Allow rescheduling from 'scheduled', or 'accepted'/'awaiting-buyer-scheduling' if they are effectively setting for the first time via "reschedule" button
      if (
        !["scheduled", "accepted", "awaiting-buyer-scheduling"].includes(
          order.status
        )
      ) {
        console.log(
          `[scheduleOrderSlot] Reschedule attempt for order ${orderId} in invalid status: ${order.status}`
        );
        return res.status(400).json({
          message: `Order status (${order.status}) does not allow rescheduling at this moment.`,
        });
      }
      console.log(
        `[scheduleOrderSlot] Rescheduling order ${orderId}. Current status: ${order.status}`
      );
    } else {
      // Initial scheduling
      if (order.status !== "awaiting-buyer-scheduling") {
        console.log(
          `[scheduleOrderSlot] Initial schedule attempt for order ${orderId} in invalid status: ${order.status}`
        );
        return res.status(400).json({
          message: `Order not awaiting scheduling. Current status: ${order.status}`,
        });
      }
      console.log(
        `[scheduleOrderSlot] Initial scheduling for order ${orderId}.`
      );
    }

    // Determine service duration (important for validation, especially for scheduled_slots)
    // Assuming order.numberOfHours stores the duration for per-hour services.
    // If service.numberOfHours exists (e.g., for fixed duration project-based services that are scheduled), use that.
    const serviceDurationHours =
      order.numberOfHours || order.service?.numberOfHours || 1;

    if (order.service.availabilityType === "scheduled_slots") {
      console.log("[scheduleOrderSlot] Processing 'scheduled_slots'.");
      if (
        !selectedSlotForDb ||
        typeof selectedSlotForDb.startTime !== "string" ||
        typeof selectedSlotForDb.endTime !== "string" ||
        !specificDateForSlot
      ) {
        console.error(
          "[scheduleOrderSlot] Validation FAILED for scheduled_slots - missing or malformed fields. Data:",
          scheduleData
        );
        return res.status(400).json({
          message:
            "Required scheduling details (slot times, date) are missing or malformed.",
        });
      }

      const chosenSpecificStartTimeStr = selectedSlotForDb.startTime; // e.g., "16:00"
      const chosenSpecificEndTimeStr = selectedSlotForDb.endTime; // e.g., "17:00"
      let dateOfBookingInstance;
      try {
        dateOfBookingInstance = new Date(specificDateForSlot); // This is the actual start date & time
        if (isNaN(dateOfBookingInstance.getTime()))
          throw new Error("Invalid date format for specificDateForSlot");
      } catch (e) {
        console.error(
          "[scheduleOrderSlot] Invalid date format for specificDateForSlot:",
          specificDateForSlot,
          e
        );
        return res
          .status(400)
          .json({ message: "Invalid date format provided for scheduling." });
      }

      const dayOfWeekOfBooking = getDayFromDateFns(dateOfBookingInstance);

      // Find the GENERAL recurring slot from the service that this booking falls into
      const parentRecurringSlot = order.service.availableTimeSlots.find(
        (recurringSlot) => {
          if (recurringSlot.dayOfWeek !== dayOfWeekOfBooking) {
            return false;
          }
          const recurringStartNumeric = timeStringToNumeric(
            recurringSlot.startTime
          );
          const recurringEndNumeric = timeStringToNumeric(
            recurringSlot.endTime
          );
          const chosenStartNumeric = timeStringToNumeric(
            chosenSpecificStartTimeStr
          );
          const chosenEndNumeric = timeStringToNumeric(
            chosenSpecificEndTimeStr
          );

          // Check if the specific chosen slot is within the bounds of this recurring slot
          // And also that the duration matches (frontend calculates endTime based on duration)
          const expectedDurationMinutes = serviceDurationHours * 60;
          const actualDurationMinutes =
            (chosenEndNumeric / 100) * 60 +
            (chosenEndNumeric % 100) -
            ((chosenStartNumeric / 100) * 60 + (chosenStartNumeric % 100));

          // A small tolerance for minute calculation might be needed if times are like HH:MM and duration is float
          // For simplicity, assuming integer hours for duration now.
          const durationMatches =
            Math.abs(actualDurationMinutes - expectedDurationMinutes) < 1; // Allow tiny diff if any due to float conversion

          return (
            chosenStartNumeric >= recurringStartNumeric &&
            chosenEndNumeric <= recurringEndNumeric &&
            durationMatches
          );
        }
      );

      if (!parentRecurringSlot) {
        console.error(
          `[scheduleOrderSlot] No matching general recurring slot found for day ${dayOfWeekOfBooking} that contains the specific time ${chosenSpecificStartTimeStr}-${chosenSpecificEndTimeStr} with duration ${serviceDurationHours}hr(s).`
        );
        console.error(
          "[scheduleOrderSlot] Service availableTimeSlots:",
          JSON.stringify(order.service.availableTimeSlots, null, 2)
        );
        return res.status(400).json({
          message:
            "The selected specific time slot is not valid within the seller's general availability or for the required duration.",
        });
      }

      console.log(
        "[scheduleOrderSlot] Validated: Specific slot fits within parent recurring slot:",
        parentRecurringSlot
      );

      order.selectedTimeSlot = {
        dayOfWeek: dayOfWeekOfBooking, // Day of the week of the actual booking date
        startTime: chosenSpecificStartTimeStr,
        endTime: chosenSpecificEndTimeStr,
        slotDate: dateOfBookingInstance, // Store the full start DateTime here
      };
      order.scheduledDateTime = null;
    } else if (
      ["date_range", "flexible"].includes(order.service.availabilityType)
    ) {
      console.log("[scheduleOrderSlot] Processing 'flexible/date_range'.");
      if (!specificDateTime) {
        console.error(
          "[scheduleOrderSlot] specificDateTime missing for flexible/date_range."
        );
        return res.status(400).json({
          message:
            "A specific date and time must be provided for this scheduling type.",
        });
      }
      try {
        const parsedSpecificDateTime = new Date(specificDateTime);
        if (isNaN(parsedSpecificDateTime.getTime()))
          throw new Error("Invalid date format for specificDateTime");
        order.scheduledDateTime = parsedSpecificDateTime;
      } catch (e) {
        console.error(
          "[scheduleOrderSlot] Invalid date format for specificDateTime:",
          specificDateTime,
          e
        );
        return res
          .status(400)
          .json({ message: "Invalid date format provided for scheduling." });
      }
      order.selectedTimeSlot = undefined;
    } else {
      console.error(
        "[scheduleOrderSlot] Invalid service.availabilityType:",
        order.service.availabilityType
      );
      return res
        .status(400)
        .json({ message: "Service does not support this scheduling method." });
    }

    order.buyerSchedulingComment = buyerSchedulingComment || undefined;
    order.status = "scheduled";
    order.buyerActionTimestamp = new Date();

    const savedOrder = await order.save();
    console.log(
      `[scheduleOrderSlot] Order ${
        isReschedule ? "rescheduled" : "scheduled"
      } and saved. Status: ${savedOrder.status}`
    );

    const io = req.app.get("socketio");
    const serviceTitle = savedOrder.service?.title || "a service";
    const orderDisplayId = savedOrder._id.toString().slice(-6);

    let scheduleInfo = "N/A";
    if (
      savedOrder.selectedTimeSlot?.slotDate &&
      savedOrder.selectedTimeSlot.startTime
    ) {
      const bookedStartDateTime = new Date(
        savedOrder.selectedTimeSlot.slotDate
      ); // slotDate is already a full DateTime
      const bookedEndDateTime = parseTimeFns(
        savedOrder.selectedTimeSlot.endTime,
        "HH:mm",
        bookedStartDateTime
      ); // Use bookedStartDateTime as base for parsing endTime to get correct date context
      scheduleInfo = `Slot on ${format(
        bookedStartDateTime,
        "EEEE, MMM d, yyyy"
      )} from ${format(bookedStartDateTime, "h:mm a")} to ${format(
        bookedEndDateTime,
        "h:mm a"
      )}`;
    } else if (savedOrder.scheduledDateTime) {
      scheduleInfo = `Time: ${format(
        new Date(savedOrder.scheduledDateTime),
        "EEEE, MMM d, yyyy, h:mm a"
      )}`;
    }

    // --- Notifications and Socket Events ---
    const notificationTypeSuffix = isReschedule ? "RESCHEDULED" : "SCHEDULED";
    const baseMessageAction = isReschedule ? "rescheduled" : "scheduled";
    const previousScheduleInfoForNotif = isReschedule
      ? order.notes || "Previously scheduled details not recorded in notes."
      : null; // Example of getting previous, improve if needed

    if (savedOrder.seller?._id && savedOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedOrder.seller._id,
        senderId: savedOrder.buyer._id,
        type: `ORDER_${notificationTypeSuffix}_SELLER`,
        title: `Order ${baseMessageAction}!`,
        message: `Order (#${orderDisplayId}) for "${serviceTitle}" has been ${baseMessageAction} by the buyer. ${scheduleInfo}.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        // emailTemplateFunc: 'generateOrderRescheduledEmail', // Create this template
        // emailTemplateArgs: [savedOrder.seller, savedOrder, savedOrder.service, true, previousScheduleInfoForNotif],
        io,
      }).catch((err) =>
        console.error(
          `[scheduleOrderSlot] Err sending order ${baseMessageAction} notification (seller):`,
          err
        )
      );
    }
    if (savedOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedOrder.buyer._id,
        senderId: savedOrder.seller._id,
        type: `ORDER_${notificationTypeSuffix}_BUYER`,
        title: `Service ${baseMessageAction}!`,
        message: `Your order (#${orderDisplayId}) for "${serviceTitle}" is now ${baseMessageAction}. ${scheduleInfo}.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        // emailTemplateFunc: isReschedule ? "generateOrderRescheduledEmail" : "generateOrderScheduledEmail",
        // emailTemplateArgs: [savedOrder.buyer, savedOrder, savedOrder.service, false, previousScheduleInfoForNotif],
        io,
      }).catch((err) =>
        console.error(
          `[scheduleOrderSlot] Err sending order ${baseMessageAction} notification (buyer):`,
          err
        )
      );
    }
    if (savedOrder.seller?._id && savedOrder.buyer?._id && io) {
      const conversationMessage = `Service ${baseMessageAction} by buyer. ${scheduleInfo}.`;
      await Conversation.findOneAndUpdate(
        { orderId: savedOrder._id },
        { $set: { lastMessage: conversationMessage, updatedAt: new Date() } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
        .then((convo) => {
          if (convo) {
            const eventData = {
              ...convo.toObject(),
              orderStatus: savedOrder.status,
              orderId: savedOrder._id,
            };
            io.to(savedOrder.buyer._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
            io.to(savedOrder.seller._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
          }
        })
        .catch((err) =>
          console.error("[scheduleOrderSlot] Conversation update error:", err)
        );

      const orderUpdateEventData = {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder.toObject({ depopulate: true }),
      };
      io.to(savedOrder.buyer._id.toString()).emit(
        "order_status_updated",
        orderUpdateEventData
      );
      io.to(savedOrder.seller._id.toString()).emit(
        "order_status_updated",
        orderUpdateEventData
      );
    }

    // Fetch again for the final response to ensure all virtuals/etc are applied if any
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate(
        "service",
        "title availabilityType availableTimeSlots availabilityInfo numberOfHours"
      )
      .populate(
        "buyer",
        "name email profilePicture accountType companyName representativeName"
      )
      .populate(
        "seller",
        "name email profilePicture accountType companyName representativeName"
      )
      .lean();

    res.status(200).json({
      message: `Order ${
          isReschedule ? "rescheduled" : "scheduled"
        } successfully.`,
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      `[scheduleOrderSlot] General error ${
        isReschedule ? "rescheduling" : "scheduling"
      } order ${orderId}:`,
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({
      message: `Internal Server Error while ${
          isReschedule ? "rescheduling" : "scheduling"
        } order.`,
    });
  }
};

/**
 * @desc    Get all respective orders (buyer and seller) including both service and product orders
 * @route   GET /api/order
 * @access  Private (Authenticated User)
 */
const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // Role-based filtering strictly from req.user
    const isFetchingSeller = req.user.isSeller === true;

    // Pagination parameters
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    let serviceOrders = [];
    let productOrders = [];

    if (isFetchingSeller) {
      // Fetch Service Orders (Seller)
      serviceOrders = await Order.find({ seller: userId })
        .populate({ path: "service", select: "title price priceType type media availabilityType" })
        .populate("buyer", "name profilePicture accountType")
        .lean();

      // Fetch Product Orders (Seller)
      productOrders = await ProductOrder.find({ seller: userId })
        .populate({ path: "items.product", select: "name images price sku" })
        .populate("buyer", "name profilePicture accountType")
        .lean();
    } else {
      // Fetch Service Orders (Buyer)
      serviceOrders = await Order.find({ buyer: userId })
        .populate({ path: "service", select: "title price priceType type media availabilityType" })
        .populate("seller", "name profilePicture companyName representativeName accountType")
        .lean();

      // Fetch Product Orders (Buyer)
      productOrders = await ProductOrder.find({ buyer: userId })
        .populate({ path: "items.product", select: "name images price sku" })
        .populate("seller", "name profilePicture companyName representativeName accountType")
        .lean();
    }

    // Format Orders
    const formattedOrders = [
      ...serviceOrders.map(order => ({ ...order, orderType: 'service' })),
      ...productOrders.map(order => ({ ...order, orderType: 'product' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate totals and apply pagination
    const totalOrders = formattedOrders.length;
    const paginatedOrders = formattedOrders.slice(skip, skip + limit);

    res.status(200).json({
      message: `${isFetchingSeller ? "Seller" : "Buyer"} orders fetched successfully`,
      data: {
        orders: paginatedOrders
      },
      pagination: {
        totalItems: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        limit: limit
      }
    });

  } catch (error) {
    console.error("Error fetching all user orders:", error);
    res.status(500).json({ message: "Error fetching all user orders", error: error.message });
  }
};

// --- GET ORDER BY ID ---
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID format." });
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "service",
        select:
          "title price priceType type media category subcategory createdBy availabilityType availableTimeSlots availabilityInfo", // Added availability fields
        populate: {
          path: "createdBy",
          select:
            "name email companyName representativeName accountType profilePicture",
        },
      })
      .populate(
        "buyer",
        "name email profilePicture accountType companyName representativeName"
      )
      .populate(
        "seller",
        "name email profilePicture accountType companyName representativeName stripeAccountId"
      )
      .lean();

    if (!order) return res.status(404).json({ message: "Order not found." });

    const isBuyer = order.buyer?._id.toString() === userId.toString();
    const isSellerOnOrder = order.seller?._id.toString() === userId.toString();

    if (!isBuyer && !isSellerOnOrder && !req.user.isAdmin) {
      // Added isAdmin check (ensure req.user.isAdmin exists)
      return res
        .status(403)
        .json({ message: "Not authorized to view this order." });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error(
      `Error fetching order by ID (${req.params?.orderId}):`,
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal Server Error fetching order." });
  }
};

// --- SELLER MARKS ORDER AS IN-PROGRESS ---
const markOrderInProgress = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id; // Can be seller or buyer, depends on your rules

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id")
      .populate("service", "title");

    if (!order) return res.status(404).json({ message: "Order not found." });

    // Rule: Only seller can mark as in-progress, or if your system allows buyer too.
    // For now, let's assume only seller.
    if (order.seller._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized for this action." });
    }

    if (order.status !== "scheduled" && order.status !== "accepted") {
      // Can go from accepted (if no scheduling) or scheduled
      return res.status(400).json({
        message: `Order cannot be marked in-progress. Current status: ${order.status}`,
      });
    }

    order.status = "in-progress";
    // order.sellerActionTimestamp = new Date(); // Or a new field like 'inProgressTimestamp'
    const savedOrder = await order.save();
    const io = req.app.get("socketio");

    // --- NOTIFICATIONS ---
    const notificationTitle = "Order In Progress";
    const serviceTitle = order.service?.title || "a service";
    const orderDisplayId = savedOrder._id.toString().slice(-6);
    const commonLink = `/user/orders/${savedOrder._id}`;

    // To Buyer
    if (order.buyer?._id) {
      createAndDispatchNotification({
        recipientId: order.buyer._id,
        senderId: order.seller._id,
        type: "ORDER_IN_PROGRESS_BUYER",
        title: notificationTitle,
        message: `Work has started on your order (#${orderDisplayId}) for "${serviceTitle}".`,
        link: commonLink,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) => console.error("Notify buyer (in-progress) err:", err));
    }
    // To Seller (confirmation)
    if (order.seller?._id) {
      createAndDispatchNotification({
        recipientId: order.seller._id,
        type: "ORDER_IN_PROGRESS_SELLER_CONFIRM",
        title: "Order Marked In Progress",
        message: `You've marked order (#${orderDisplayId}) for "${serviceTitle}" as in progress.`,
        link: commonLink,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error("Notify seller (in-progress confirm) err:", err)
      );
    }
    // --- END NOTIFICATIONS ---

    // --- SOCKET UPDATES ---
    if (io) {
      const eventData = {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder,
      };
      io.to(order.buyer._id.toString()).emit("order_status_updated", eventData);
      io.to(order.seller._id.toString()).emit(
        "order_status_updated",
        eventData
      );
    }
    // --- END SOCKETS ---

    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "service buyer seller",
      "title name email profilePicture"
    );
    res
      .status(200)
      .json({ message: "Order marked as in-progress.", order: populatedOrder });
  } catch (error) {
    console.error(
      `Error marking order in-progress (${req.params?.orderId}):`,
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- BUYER MARKS ORDER AS COMPLETED ---
const markOrderCompleted = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user._id;

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email _id")
      .populate("seller", "name email _id stripeAccountId country");

    // ... (keep all the initial checks for order, buyer, status, etc.)
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.buyer._id.toString() !== buyerId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the buyer can mark an order as completed." });
    }
    // ...

    // --- START: SIMPLIFIED SELLER ACCOUNT CHECK ---

    // Check if seller has a Stripe Connected Account AT ALL
    if (!order.seller?.stripeAccountId) {
      // THIS BLOCK IS GOOD, KEEP IT AS IS.
      // It handles creating a new account and sending the first onboarding link.
      console.log(
        `[Complete Order] Seller ${order.seller._id} does not have a connected payout account. Creating one.`
      );
      // ... all your existing logic for creating an account and link
      const accountCreationResult = await createConnectedAccount(
        order.seller.email,
        order.seller.country || "US", // Use seller's country, default to US
        "express", // Using Express accounts for easier KYC/onboarding
        { userId: order.seller._id.toString() }
      );

      if (!accountCreationResult.success) {
        console.error(
          `[Complete Order] Failed to create connected payout account for seller ${order.seller._id}:`,
          accountCreationResult.message
        );
        order.status = "payout-failed";
        order.notes = `[Payout Error] Failed to create Stripe Connected Account: ${accountCreationResult.message}`;
        await order.save();
        const io = req.app.get("socketio");
        const serviceTitle = order.service?.title || "a service";
        const orderDisplayId = order._id.toString().slice(-6);
        if (order.seller?._id) {
          createAndDispatchNotification({
            recipientId: order.seller._id,
            type: "SELLER_STRIPE_ACCOUNT_CREATION_FAILED",
            title: "Stripe Account Setup Failed",
            message: `We encountered an issue setting up your Stripe account for payouts. Please contact support.`,
            link: `/user/profile/edit`,
            relatedResource: order._id,
            relatedResourceType: "Order",
            io,
          }).catch((err) =>
            console.error(
              "Error notifying seller about account creation failure:",
              err
            )
          );
        }
        return res.status(500).json({
          message: `Failed to set up seller's payment account: ${accountCreationResult.message}. Please contact support.`,
        });
      }

      const newStripeAccountId = accountCreationResult.account.id;
      order.seller.stripeAccountId = newStripeAccountId; // Update the populated seller object
      await User.findByIdAndUpdate(order.seller._id, {
        stripeAccountId: newStripeAccountId,
      }); // Save to User model

      console.log(
        `[Complete Order] Connected payout account ${newStripeAccountId} created and saved for seller ${order.seller._id}.`
      );

      // 2. Send the seller a custom onboarding link
      // These URLs should be configured in your environment variables or a config file
      const refreshUrl = `${process.env.FRONTEND_URL}/user/orders/${order._id}?stripe_onboarding=refresh`;
      const returnUrl = `${process.env.FRONTEND_URL}/user/orders/${order._id}?stripe_onboarding=success`;

      const accountLinkResult = await createAccountLink(
        newStripeAccountId,
        refreshUrl,
        returnUrl,
        "account_onboarding"
      );

      if (!accountLinkResult.success) {
        console.error(
          `[Complete Order] Failed to create payout onboarding link for seller ${order.seller._id}:`,
          accountLinkResult.message
        );
        order.status = "payout-pending"; // Keep as pending
        order.notes = `[Payout Error] Stripe account created, but failed to generate onboarding link: ${accountLinkResult.message}`;
        await order.save();
        const io = req.app.get("socketio");
        if (order.seller?._id) {
          createAndDispatchNotification({
            recipientId: order.seller._id,
            type: "SELLER_STRIPE_ACCOUNT_ONBOARDING_LINK_FAILED",
            title: "Action Required: Complete Stripe Setup",
            message: `Your Stripe account was created, but we couldn't generate your onboarding link automatically. Please visit your profile settings to complete your Stripe setup and receive payouts.`,
            link: `/user/profile/edit`,
            relatedResource: order._id,
            relatedResourceType: "Order",
            io,
          }).catch((err) =>
            console.error("Error notifying seller about link failure:", err)
          );
        }
        return res.status(500).json({
          message: `Seller's payment account created, but onboarding link could not be generated. Please contact support.`,
        });
      }

      const onboardingLink = accountLinkResult.accountLink.url;
      console.log(
        `[Complete Order] Onboarding link generated for seller ${order.seller._id}: ${onboardingLink}`
      );

      // Update order status and notify seller/admin
      order.status = "payout-pending";
      order.notes = `[Payout Pending] Seller Stripe account created. Awaiting onboarding completion. Onboarding Link: ${onboardingLink}`;
      order.onboardingLink = onboardingLink; // Save the onboarding link to the order
      await order.save();

      const io = req.app.get("socketio");
      const serviceTitle = order.service?.title || "a service";
      const orderDisplayId = order._id.toString().slice(-6);
      const commonLink = `/user/orders/${order._id}`;

      console.log("OnboradingLink", onboardingLink);

      // Notify seller with the onboarding link
      if (order.seller?._id) {
        createAndDispatchNotification({
          recipientId: order.seller._id,
          type: "SELLER_STRIPE_ACCOUNT_ONBOARDING_REQUIRED",
          title: "Action Required: Complete Stripe Account Setup",
          message: `Your order (#${orderDisplayId}) for "${serviceTitle}" has been marked completed by the buyer. To receive your payout, please complete your Stripe account setup: ${onboardingLink}`,
          link: `/user/orders/${order._id}`, // Direct link to Stripe onboarding
          relatedResource: order._id,
          relatedResourceType: "Order",
          io,
        }).catch((err) =>
          console.error(
            "Error notifying seller about payout onboarding link:",
            err
          )
        );
      }
      // Notify admin about pending payout due to onboarding
      const adminUsers = await User.find({ isAdmin: true });
      for (const admin of adminUsers) {
        createAndDispatchNotification({
          recipientId: admin._id,
          type: "ADMIN_SELLER_PAYOUT_PENDING_ONBOARDING",
          title: "Seller Payout Pending: Payout Onboarding Required",
          message: `Payout for order (#${orderDisplayId}) to seller ${order.seller.name} is pending. Seller needs to complete Stripe onboarding. Link sent.`,
          link: `/user/orders/${order._id}`,
          relatedResource: order._id,
          relatedResourceType: "Order",
          io,
        }).catch((err) =>
          console.error(
            "Error notifying admin about pending onboarding payout:",
            err
          )
        );
      }
      // Update sockets for both buyer and seller with the new status
      if (io) {
        const eventData = {
          orderId: order._id,
          status: order.status,
          order: order,
        };
        io.to(order.buyer._id.toString()).emit(
          "order_status_updated",
          eventData
        );
        io.to(order.seller._id.toString()).emit(
          "order_status_updated",
          eventData
        );
      }
      return res.status(200).json({
        message:
          "Order completed. Payout is pending seller's Stripe account setup. An onboarding link has been sent to the seller.",
        order,
        onboardingLink, // Optionally send link to client for immediate redirect
      });
    }

    // --- If seller ACCOUNT EXISTS, check its status ---
    if (order.seller.stripeAccountId) {
      const statusResult = await getConnectedAccountStatus(
        order.seller.stripeAccountId
      );
      let sellerStripeAccount = statusResult.account;

      const hasActiveTransfers =
        sellerStripeAccount.capabilities?.transfers?.status === "active";
      const noPendingRequirements =
        sellerStripeAccount.requirements?.currently_due?.length === 0;
      const detailsSubmitted = sellerStripeAccount.details_submitted;

      // If the account IS NOT ready for payouts, send them back to onboarding
      if (!hasActiveTransfers || !noPendingRequirements || !detailsSubmitted) {
        // THIS BLOCK IS ALSO GOOD. It handles cases where the user exists but hasn't finished.
        // It generates a new link and puts the order in pending.
        console.log(
          `[Complete Order] Seller ${order.seller._id} Stripe Account is not fully ready for payouts.`
        );
        order.status = "payout-pending";
        order.notes =
          `[Payout Pending] Seller Stripe account requires further setup. ` +
          `Details submitted: ${detailsSubmitted}, Pending requirements: ${sellerStripeAccount.requirements?.currently_due?.join(", ") ||
          "None"
          }.`;

        // Generate an account link for the seller to complete onboarding/update details
        const refreshUrl = `${process.env.FRONTEND_URL}/user/orders/${order._id}?stripe_onboarding=refresh`;
        const returnUrl = `${process.env.FRONTEND_URL}/user/orders/${order._id}?stripe_onboarding=success`;
        const accountLinkResult = await createAccountLink(
          order.seller.stripeAccountId,
          refreshUrl,
          returnUrl,
          "account_onboarding" // Always use account_onboarding as per Stripe error
        );

        if (accountLinkResult.success) {
          const onboardingLink = accountLinkResult.accountLink.url;
          order.onboardingLink = onboardingLink; // Save the onboarding link to the order
          await order.save();

          console.log(
            `[Complete Order] Generated onboarding/update link for seller ${order.seller._id}: ${onboardingLink}`
          );

          // Notify seller with the onboarding link
          createAndDispatchNotification({
            recipientId: order.seller._id,
            type: "SELLER_STRIPE_ACCOUNT_ONBOARDING_REQUIRED",
            title: "Action Required: Complete Stripe Account Setup",
            message: `Your order (#${order._id
              .toString()
              .slice(
                -6
              )}) has been marked completed. To receive payout, complete your Stripe account setup: ${onboardingLink}`,
            link: `/user/orders/${order.id}`,
            relatedResource: order._id,
            relatedResourceType: "Order",
            io: req.app.get("socketio"),
          }).catch((err) =>
            console.error(
              "Error notifying seller about payout onboarding link:",
              err
            )
          );
        } else {
          console.error(
            `[Complete Order] Failed to create payout onboarding link for seller ${order.seller._id}:`,
            accountLinkResult.message
          );
          order.notes += ` Failed to generate onboarding link: ${accountLinkResult.message}`;
          await order.save(); // Save notes about link failure
          createAndDispatchNotification({
            recipientId: order.seller._id,
            type: "SELLER_STRIPE_ACCOUNT_ONBOARDING_LINK_FAILED",
            title: "Action Required: Complete Stripe Setup",
            message: `Your payout account has pending requirements, but we couldn't generate your onboarding link automatically. Please visit your profile settings to complete your payout setup and receive payouts.`,
            link: `/user/profile/edit`,
            relatedResource: order._id,
            relatedResourceType: "Order",
            io: req.app.get("socketio"),
          }).catch((err) =>
            console.error("Error notifying seller about link failure:", err)
          );
        }

        // Notify admin about pending payout due to onboarding
        const adminUsers = await User.find({ isAdmin: true });
        for (const admin of adminUsers) {
          createAndDispatchNotification({
            recipientId: admin._id,
            type: "ADMIN_SELLER_PAYOUT_PENDING_ONBOARDING",
            title: "Seller Payout Pending: Payout Onboarding Required",
            message: `Payout for order (#${order._id
              .toString()
              .slice(-6)}) to seller ${order.seller.name
              } is pending. Seller needs to complete Stripe onboarding.`,
            link: `/user/orders/${order._id}`,
            relatedResource: order._id,
            relatedResourceType: "Order",
            io: req.app.get("socketio"),
          }).catch((err) =>
            console.error(
              "Error notifying admin about pending onboarding payout:",
              err
            )
          );
        }
        // Update sockets for both buyer and seller with the new status
        const io = req.app.get("socketio");
        if (io) {
          const eventData = {
            orderId: order._id,
            status: order.status,
            order: order,
          };
          io.to(order.buyer._id.toString()).emit(
            "order_status_updated",
            eventData
          );
          io.to(order.seller._id.toString()).emit(
            "order_status_updated",
            eventData
          );
        }
        return res.status(200).json({
          message:
            "Order completed. Payout is pending seller's payout account setup. An onboarding link has been sent to the seller.",
          order,
          onboardingLink: order.onboardingLink, // Send the link if successfully generated
        });
      }

      // If we reach here, it means transfers ARE active and the account is ready.
      // We can proceed DIRECTLY to the payout logic.
      console.log(
        `[Complete Order] Seller account is ready. Proceeding with payout.`
      );
    }

    // --- MAIN PAYOUT LOGIC (This is now only reached if the account is 100% ready) ---
    console.log(
      `[Complete Order] Step 1: Attempting to capture PaymentIntent...`
    );
    // Step 1: Capture the funds that are on hold, or confirm if already succeeded.
    console.log(
      `[Complete Order] Step 1: Attempting to capture PaymentIntent ${order.paymentIntentId} for order ${order._id}`
    );
    const {
      success,
      message,
      alreadyCaptured,
      intent: capturedOrSucceededIntent,
    } = await capturePaymentIfNeeded(order.paymentIntentId);

    if (!success) {
      console.error(
        `[Complete Order] FAILED to capture/confirm funds for order ${order._id}:`,
        message
      );
      order.status = "payout-failed";
      order.notes = `[Payout Error] Failed to capture/confirm funds: ${message}`;
      await order.save();
      // Notify admin
      const io = req.app.get("socketio");
      const serviceTitle = order.service?.title || "a service";
      const orderDisplayId = order._id.toString().slice(-6);
      const adminUsers = await User.find({ isAdmin: true });
      for (const admin of adminUsers) {
        createAndDispatchNotification({
          recipientId: admin._id,
          type: "ADMIN_SELLER_PAYOUT_FAILED",
          title: "Seller Payout Failed",
          message: `Payout for order (#${orderDisplayId}) to seller ${order.seller.name} failed: ${message}. Manual review required.`,
          link: `/user/orders/${order._id}`,
          relatedResource: order._id,
          relatedResourceType: "Order",
          io,
        }).catch((err) =>
          console.error("Error notifying admin about capture failure:", err)
        );
      }
      // Socket updates for failed payout
      if (io) {
        const eventData = {
          orderId: order._id,
          status: order.status,
          order: order,
        };
        io.to(order.buyer._id.toString()).emit(
          "order_status_updated",
          eventData
        );
        io.to(order.seller._id.toString()).emit(
          "order_status_updated",
          eventData
        );
      }
      return res.status(500).json({
        message: `Failed to process payment: ${message}. Please contact support.`,
      });
    }

    console.log(
      `[Complete Order] PaymentIntent ${order.paymentIntentId} status: ${capturedOrSucceededIntent.status
      }. ${alreadyCaptured
        ? "Already succeeded, skipping capture."
        : "Captured now."
      }`
    );

    // Ensure we have a charge ID for the transfer. If already succeeded, use its latest_charge.
    const chargeIdForTransfer = capturedOrSucceededIntent.latest_charge;
    if (!chargeIdForTransfer) {
      console.error(
        `[Complete Order] No charge ID found for PaymentIntent ${order.paymentIntentId}. Cannot proceed with transfer.`
      );
      order.status = "payout-failed";
      order.notes = `[Payout Error] No charge ID found for PaymentIntent after capture/succeeded check.`;
      await order.save();
      // Notify admin
      const io = req.app.get("socketio");
      const serviceTitle = order.service?.title || "a service";
      const orderDisplayId = order._id.toString().slice(-6);
      const adminUsers = await User.find({ isAdmin: true });
      for (const admin of adminUsers) {
        createAndDispatchNotification({
          recipientId: admin._id,
          type: "ADMIN_SELLER_PAYOUT_FAILED",
          title: "Seller Payout Failed",
          message: `Payout for order (#${orderDisplayId}) to seller ${order.seller.name} failed: No charge ID found for PaymentIntent. Manual review required.`,
          link: `/user/orders/${order._id}`,
          relatedResource: order._id,
          relatedResourceType: "Order",
          io,
        }).catch((err) =>
          console.error("Error notifying admin about missing charge ID:", err)
        );
      }
      if (io) {
        const eventData = {
          orderId: order._id,
          status: order.status,
          order: order,
        };
        io.to(order.buyer._id.toString()).emit(
          "order_status_updated",
          eventData
        );
        io.to(order.seller._id.toString()).emit(
          "order_status_updated",
          eventData
        );
      }
      return res.status(500).json({
        message:
          "Failed to retrieve payment details for transfer. Please contact support.",
      });
    }

    // Step 2: Transfer commission to the seller based on dynamic rates
    const commissionRates = await getCommissionRates();
    let platformFeePercentage;
    
    if (commissionRates.type === 'percentage') {
      platformFeePercentage = (commissionRates.standard?.offerPercent || 0) / 100;
    } else if (commissionRates.type === 'flat') {
      platformFeePercentage = (commissionRates.flatAmount || 0) / order.totalPrice;
    } else {
      platformFeePercentage = 0.2; // Default fallback
    }
    
    const amountToTransfer = Math.round(
      order.totalPrice * 100 * (1 - platformFeePercentage)
    );

    console.log(
      `[Complete Order] Step 2: Transferring ${amountToTransfer / 100
      } USD to seller ${order.seller.stripeAccountId}`
    );
    const transferResult = await createTransfer(
      amountToTransfer,
      order.seller.stripeAccountId,
      chargeIdForTransfer, // Use the obtained charge ID
      { order_id: order._id.toString() }
    );

    if (!transferResult.success) {
      console.error(
        `[Complete Order] FAILED to transfer funds for order ${order._id}:`,
        transferResult.message
      );
      order.status = "payout-failed";
      order.notes = `[Payout Error] Funds captured but transfer failed: ${transferResult.message}`;
      await order.save();
      // NOTE: This situation requires admin intervention, as you have the money but couldn't send it.
      // A full refund might be necessary if the transfer can't be resolved.
      // Notify admin immediately.
      const io = req.app.get("socketio");
      const serviceTitle = order.service?.title || "a service";
      const orderDisplayId = order._id.toString().slice(-6);
      const adminUsers = await User.find({ isAdmin: true });
      for (const admin of adminUsers) {
        createAndDispatchNotification({
          recipientId: admin._id,
          type: "ADMIN_SELLER_PAYOUT_FAILED",
          title: "Seller Payout Failed",
          message: `Payout for order (#${orderDisplayId}) to seller ${order.seller.name} failed: ${transferResult.message}. Manual review required.`,
          link: `/user/orders/${order._id}`,
          relatedResource: order._id,
          relatedResourceType: "Order",
          io,
        }).catch((err) =>
          console.error("Error notifying admin about transfer failure:", err)
        );
      }
      // Socket updates for failed payout
      if (io) {
        const eventData = {
          orderId: order._id,
          status: order.status,
          order: order,
        };
        io.to(order.buyer._id.toString()).emit(
          "order_status_updated",
          eventData
        );
        io.to(order.seller._id.toString()).emit(
          "order_status_updated",
          eventData
        );
      }
      return res.status(500).json({
        message:
          "Payment was processed, but the transfer to the seller failed. Please contact support.",
      });
    }

    console.log(
      `[Complete Order] Transfer successful. Transfer ID: ${transferResult.transfer.id}`
    );

    // Step 3: Update order status to 'completed'
    order.status = "completed";
    order.completionTimestamp = new Date();
    order.transferDetails = {
      transferId: transferResult.transfer.id,
      amount: transferResult.transfer.amount,
      destination: transferResult.transfer.destination,
      status: transferResult.transfer.status,
      processedAt: new Date(),
    };
    await order.save();

    try {
      const adminAmountExpected = Number(
        (order.totalPrice * platformFeePercentage).toFixed(2)
      );
      const sellerAmountExpected = Number(
        (order.totalPrice * (1 - platformFeePercentage)).toFixed(2)
      );
      await PaymentSplit.findOneAndUpdate(
        {
          orderType: "service_order",
          orderId: order._id,
        },
        {
          $set: {
            buyer: order.buyer?._id,
            seller: order.seller?._id,
            totalAmount: order.totalPrice,
            currency: "USD",
            platformFeePercent: platformFeePercentage,
            adminAmountExpected,
            sellerAmountExpected,
            adminAmountActual: adminAmountExpected,
            sellerAmountActual: Number((amountToTransfer / 100).toFixed(2)),
            isSplitApplied: true,
            paymentProvider: "stripe",
            paymentReferenceId: transferResult.transfer.id,
            notes:
              "Saved for audit/demo. 80% transferred to seller and 20% retained by platform.",
            snapshot: {
              amountToTransferCents: amountToTransfer,
              chargeIdForTransfer,
              stripeTransferId: transferResult.transfer.id,
              stripeTransferStatus: transferResult.transfer.status,
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (splitError) {
      console.error(
        `[Complete Order] Failed to save PaymentSplit for service order ${order._id}:`,
        splitError.message
      );
    }

    // --- Dispatch notifications and socket events for success ---
    const io = req.app.get("socketio");
    const serviceTitle = order.service?.title || "a service";
    const orderDisplayId = order._id.toString().slice(-6);
    const commonLink = `/user/orders/${order._id}`;

    // Notifications for successful completion
    if (order.seller?._id) {
      createAndDispatchNotification({
        recipientId: order.seller._id,
        senderId: order.buyer._id,
        type: "ORDER_COMPLETED_SELLER",
        title: "Order Completed!",
        message: `Order (#${orderDisplayId}) for "${serviceTitle}" marked as completed by the buyer. Funds transferred!`,
        link: commonLink,
        relatedResource: order._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) => console.error("Notify seller (completed) err:", err));
    }
    if (order.buyer?._id) {
      createAndDispatchNotification({
        recipientId: order.buyer._id,
        type: "ORDER_COMPLETED_BUYER_CONFIRM",
        title: "Order Marked Completed",
        message: `You've marked order (#${orderDisplayId}) for "${serviceTitle}" as completed. Thank you!`,
        link: commonLink,
        relatedResource: order._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error("Notify buyer (completed confirm) err:", err)
      );
    }
    // Socket updates for successful completion
    if (io) {
      const eventData = {
        orderId: order._id,
        status: order.status,
        order: order,
      };
      io.to(order.buyer._id.toString()).emit("order_status_updated", eventData);
      io.to(order.seller._id.toString()).emit(
        "order_status_updated",
        eventData
      );
    }

    res.status(200).json({
      message: "Order successfully completed and funds transferred.",
      order,
    });
  } catch (error) {
    console.error(
      `Error in markOrderCompleted for order ${req.params?.orderId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "An unexpected internal server error occurred." });
  }
};

// --- BUYER REQUESTS REFUND / MARKS NOT COMPLETED (DISPUTE) ---
const requestOrderRefund = async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body; // Reason for dispute/refund request
  const buyerId = req.user._id;

  if (!reason || reason.trim() === "") {
    return res.status(400).json({
      message:
        "A reason is required to request a refund or mark as not completed.",
    });
  }

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id")
      .populate("service", "title");

    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.buyer._id.toString() !== buyerId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the buyer can initiate this action." });
    }

    // Define statuses from which a refund can be requested
    const allowedStatusesForDispute = ["in-progress", "completed"]; // Or just 'in-progress' if 'completed' is final
    if (!allowedStatusesForDispute.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot request refund/dispute from current status: ${order.status}`,
      });
    }

    // Check if a refund was already processed for this order to avoid double refunds
    if (order.refundDetails && order.refundDetails.refundId) {
      return res.status(400).json({
        message:
          "A refund has already been processed or is pending for this order.",
      });
    }

    // Attempt Stripe Refund
    if (!order.paymentIntentId) {
      console.error(
        `CRITICAL: Refund request for order ${orderId}: Missing paymentIntentId.`
      );
      // Potentially still allow a dispute status but flag for admin
      order.status = "disputed"; // Or "refund-requested"
      order.disputeReason = reason;
      order.disputeTimestamp = new Date();
      order.buyerActionTimestamp = new Date();
      order.notes =
        (order.notes || "") +
        "\n[Admin Action Required] Dispute raised, but automatic refund failed: Missing Payment Intent ID.";
      // No Stripe refund processed here.
    } else {
      const refundResult = await createRefund(order.paymentIntentId, {
        reason: "requested_by_customer",
        metadata: { order_id: orderId, dispute_reason: reason },
      });

      if (!refundResult.success || !refundResult.refund) {
        console.error(
          `Stripe refund failed for PI ${order.paymentIntentId} (Order ${orderId}) on dispute:`,
          refundResult.error || refundResult.message
        );
        order.status = "disputed"; // Mark as disputed for admin review even if refund fails
        order.disputeReason = reason;
        order.disputeTimestamp = new Date();
        order.buyerActionTimestamp = new Date();
        order.notes =
          (order.notes || "") +
          `\n[Admin Action Required] Dispute raised. Stripe Refund FAILED: ${
            refundResult.message || "Stripe err"
          }.`;
      } else {
        // Refund initiated successfully with Stripe
        order.status = "refunded"; // Or "refund-requested" if you have an admin review step
        order.disputeReason = reason;
        order.disputeTimestamp = new Date();
        order.buyerActionTimestamp = new Date();
        order.refundDetails = {
          refundId: refundResult.refund.id,
          amount: refundResult.refund.amount, // Amount in cents from Stripe
          reason: refundResult.refund.reason,
          status: refundResult.refund.status,
          processedAt: new Date(refundResult.refund.created * 1000),
        };
        order.notes =
          (order.notes || "") +
          `\n[Info] Dispute raised by buyer. Stripe Refund Initiated. ID: ${refundResult.refund.id}`;
      }
    }

    const savedOrder = await order.save();
    const io = req.app.get("socketio");

    // --- NOTIFICATIONS ---
    const serviceTitle = order.service?.title || "a service";
    const orderDisplayId = savedOrder._id.toString().slice(-6);
    const commonLink = `/user/orders/${savedOrder._id}`;
    const disputeMessageForSeller = `Buyer requested a refund/dispute for order (#${orderDisplayId}) for "${serviceTitle}". Reason: ${reason}. Action may be required.`;
    const disputeMessageForBuyer = `Your refund request/dispute for order (#${orderDisplayId}) for "${serviceTitle}" (Reason: ${reason}) has been submitted.`;

    // To Seller
    if (order.seller?._id) {
      createAndDispatchNotification({
        recipientId: order.seller._id,
        senderId: order.buyer._id,
        type: "ORDER_DISPUTE_RAISED_SELLER",
        title: "Order Dispute/Refund Request",
        message: disputeMessageForSeller,
        link: commonLink,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) => console.error("Notify seller (dispute) err:", err));
    }
    // To Buyer (confirmation)
    if (order.buyer?._id) {
      createAndDispatchNotification({
        recipientId: order.buyer._id,
        type: "ORDER_DISPUTE_SUBMITTED_BUYER",
        title: "Dispute/Refund Request Submitted",
        message:
          disputeMessageForBuyer +
          (savedOrder.status === "refunded" ||
            savedOrder.status === "refund-requested"
            ? " Refund initiated."
            : " Awaiting review."),
        link: commonLink,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error("Notify buyer (dispute confirm) err:", err)
      );
    }
    // --- END NOTIFICATIONS ---

    // --- SOCKETS ---
    if (io) {
      const eventData = {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder,
      };
      io.to(order.buyer._id.toString()).emit("order_status_updated", eventData);
      io.to(order.seller._id.toString()).emit(
        "order_status_updated",
        eventData
      );
    }
    // --- END SOCKETS ---

    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "service buyer seller",
      "title name email profilePicture"
    );
    res.status(200).json({
      message: `Refund request submitted. Status: ${savedOrder.status}.`,
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      `Error requesting refund for order (${req.params?.orderId}):`,
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- DELETE ORDER (Buyer Action, only if status is 'pending-payment') ---
const deleteOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id; // Buyer who wants to delete

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check 1: Is the current user the buyer of this order?
    if (order.buyer.toString() !== userId.toString()) {
      return res.status(403).json({
        message:
          "Not authorized to delete this order. Only the buyer can delete.",
      });
    }

    // Check 2: Is the order status 'pending-payment'?
    if (order.status !== "pending-payment") {
      return res.status(400).json({
        message: `Order cannot be deleted. Current status is '${order.status}'. Only 'pending-payment' orders can be deleted.`,
      });
    }

    // If checks pass, proceed with deletion
    // Optional: If you wanted to cancel the Stripe Payment Intent associated with it (if it won't be paid)
    // This is good practice to avoid lingering intents, but handle errors gracefully.
    if (order.paymentIntentId) {
      try {
        const cancelResult = await cancelPaymentIntent(order.paymentIntentId);
        if (!cancelResult.success) {
          console.warn(
            `Could not cancel Stripe PI ${order.paymentIntentId}: ${cancelResult.message}`,
            cancelResult.error
          );
        } else {
          console.log(`Stripe PI ${order.paymentIntentId} cancelled.`);
        }
      } catch (stripeError) {
        console.warn(
          `Error cancelling Stripe Payment Intent ${order.paymentIntentId} during order deletion:`,
          stripeError.message
        );
      }
    }

    await Order.findByIdAndDelete(orderId);

    // TODO: Optionally, clean up related conversations or notifications if necessary, though often not required for a pending order.

    res.status(200).json({ message: "Order deleted successfully." });
  } catch (error) {
    console.error(
      `Error deleting order (${req.params?.orderId}):`,
      error.message,
      error.stack
    );
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid Order ID format." });
    }
    res
      .status(500)
      .json({ message: "Internal server error while deleting order." });
  }
};

// --- BUYER REQUESTS REFUND AFTER SELLER DECLINED ---
const processRefundAfterDecline = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user._id;
  const { buyerReason } = req.body; // Optional reason from buyer

  console.log(
    `[processRefundAfterDecline] Buyer ${buyerId} finalizing refund for declined order ${orderId}. Reason: "${
      buyerReason || "N/A"
    }"`
  );

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id") // Original seller who declined
      .populate("service", "title");

    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.buyer._id.toString() !== buyerId.toString())
      return res
        .status(403)
        .json({ message: "Only the buyer can request this refund." });
    if (order.status !== "seller-declined-awaiting-buyer") {
      return res.status(400).json({
        message: `Cannot process refund. Order status: ${order.status}`,
      });
    }
    if (order.refundDetails?.refundId)
      return res
        .status(400)
        .json({ message: "Refund already processed or pending." });

    order.buyerReasonForRefundChoice = buyerReason || undefined;
    let refundSystemMessage = ""; // For internal notes and potentially for user messages

    if (!order.paymentIntentId) {
      order.notes =
        (order.notes || "") +
        `\n[Admin Review] Buyer refund (post-decline) FAILED: No PI. Buyer reason: ${
          buyerReason || "N/A"
        }`;
      refundSystemMessage =
        "Refund request noted. Automatic refund failed (missing payment info). Admin will review.";
      // Status might remain 'seller-declined-awaiting-buyer' or a new 'refund-failed-admin-review'
    } else {
      const refundResult = await createRefund(order.paymentIntentId, {
        reason: "requested_by_customer",
        metadata: {
          order_id: orderId,
          context: "seller_declined_buyer_chose_refund",
          buyer_reason: buyerReason || "",
        },
      });

      if (!refundResult.success || !refundResult.refund) {
        order.notes =
          (order.notes || "") +
          `\n[Admin Review] Buyer refund (post-decline) Stripe FAILED: ${
            refundResult.message || "Stripe err"
          }. Buyer reason: ${buyerReason || "N/A"}`;
        refundSystemMessage =
          "Refund request noted. Stripe refund attempt failed. Admin will review.";
      } else {
        order.status = "buyer-cancelled-post-decline"; // Or "refunded"
        order.refundDetails = {
          refundId: refundResult.refund.id,
          amount: refundResult.refund.amount,
          reason:
            refundResult.refund.reason ||
            "Seller declined; buyer requested refund.",
          status: refundResult.refund.status,
          processedAt: new Date(refundResult.refund.created * 1000),
        };
        order.notes =
          (order.notes || "") +
          `\n[Info] Buyer refund (post-decline) SUCCESS. Stripe ID: ${
            refundResult.refund.id
          }. Buyer reason: ${buyerReason || "N/A"}`;
        refundSystemMessage =
          "Refund processed successfully. Funds should appear in 5-10 business days.";
      }
    }

    order.buyerActionTimestamp = new Date();
    const savedOrder = await order.save();
    const io = req.app.get("socketio");
    const serviceTitle = savedOrder.service?.title || "a service";
    const orderDisplayId = savedOrder._id.toString().slice(-6);

    if (savedOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedOrder.buyer._id,
        type: "ORDER_REFUND_PROCESSED_EMAIL_BUYER", // ENSURE THIS IS IN NotificationSchema
        title: "Refund Processed for Declined Order",
        message: `Your refund request for order (#${orderDisplayId}) for "${serviceTitle}" has been processed. Status: ${refundSystemMessage}`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        emailTemplateFunc: "generateOrderRefundProcessedEmailForBuyer", // You'll create this
        emailTemplateArgs: [
          savedOrder.buyer,
          savedOrder,
          buyerReason,
          refundSystemMessage.includes("successfully"),
        ],
        io,
        pushNotificationBody: `Refund for order #${orderDisplayId} processed.`,
      }).catch((err) =>
        console.error("[processRefundAfterDecline] Notify buyer err:", err)
      );
    }
    if (savedOrder.seller?._id) {
      createAndDispatchNotification({
        recipientId: savedOrder.seller._id,
        senderId: savedOrder.buyer._id,
        type: "ORDER_BUYER_CHOSE_REFUND_POST_DECLINE", // ENSURE THIS IS IN NotificationSchema
        title: "Buyer Chose Refund",
        message: `Buyer for order (#${orderDisplayId}) for "${serviceTitle}" chose a refund after your decline. Current status: ${savedOrder.status}.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error("[processRefundAfterDecline] Notify seller err:", err)
      );
    }

    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "service buyer seller"
    );
    res
      .status(200)
      .json({ message: refundSystemMessage, order: populatedOrder });
  } catch (error) {
    console.error(
      `[processRefundAfterDecline] Error for order ${orderId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal server error processing refund." });
  }
};

const findAnotherSellerForOrder = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user._id;

  console.log(
    `[findAnotherSellerForOrder] Buyer ${buyerId} initiated 'Find Another Seller' for order ${orderId}.`
  );
  console.log(
    `[findAnotherSellerForOrder] Current Order Status (should be 'seller-declined-awaiting-buyer'): (Fetch order to confirm if needed)`
  );

  // For now, this endpoint doesn't change the order state itself.
  // It's a signal that the frontend will guide the user to search.
  // The original order remains for the buyer to explicitly request a refund later if they find a new service.

  // Fetch order to log its current state and include in response
  const order = await Order.findById(orderId)
    .populate("service", "title category")
    .lean();
  if (!order) {
    console.log(
      `[findAnotherSellerForOrder] Order ${orderId} not found during acknowledgement.`
    );
    return res.status(404).json({ message: "Order not found." });
  }
  if (order.buyer.toString() !== buyerId.toString()) {
    console.log(
      `[findAnotherSellerForOrder] Unauthorized attempt for order ${orderId}`
    );
    return res.status(403).json({ message: "Unauthorized." });
  }
  if (order.status !== "seller-declined-awaiting-buyer") {
    console.log(
      `[findAnotherSellerForOrder] Action not allowed for order ${orderId} with status ${order.status}`
    );
    return res.status(400).json({
      message: "This action is not allowed for the current order status.",
    });
  }

  console.log(
    `[findAnotherSellerForOrder] Order ${orderId} (service: ${order.service?.title}) acknowledged for buyer to find alternatives.`
  );
  // No status change here by design for the simple placeholder.
  // If implementing full reassignment, this is where status would change to 'buyer-requested-reassignment',
  // seller field cleared, originalSellerId stored, etc.

  res.status(200).json({
    message:
      "You will be redirected to search for services. If you create a new order, please remember to request a refund for this declined order.",
    order, // Send back current order state
  });
};

// --- BUYER REAFFIRMS ORIGINAL TIME PREFERENCE ---
const reaffirmOriginalTimePreference = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user._id;

  console.log(
    `[reaffirmOriginalTimePreference] Buyer ${buyerId} is reaffirming original preference for order ${orderId}`
  );

  try {
    const order = await Order.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id")
      .populate("service", "title");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (order.buyer._id.toString() !== buyerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized for this action." });
    }
    if (order.status !== "awaiting-buyer-time-adjustment") {
      return res.status(400).json({
        message: `Order status (${order.status}) does not allow reaffirming preference. Expected 'awaiting-buyer-time-adjustment'.`,
      });
    }

    const originalTimePreferenceForNotification = order.timePreference; // Capture before clearing

    order.status = "awaiting-seller-confirmation";
    order.buyerActionTimestamp = new Date();
    order.sellerProposedTimePreferences = undefined;
    order.sellerTimeProposalMessage = undefined;
    order.notes =
      (order.notes || "") +
      `\n[Info] Buyer reaffirmed original time preference: ${originalTimePreferenceForNotification}. Awaiting seller action.`;

    const savedOrder = await order.save();
    const io = req.app.get("socketio");

    // Notifications (ensure types are in NotificationSchema enum)
    if (savedOrder.seller?._id && savedOrder.buyer?._id) {
      // Check both exist for sender/recipient logic
      createAndDispatchNotification({
        recipientId: savedOrder.seller._id,
        senderId: savedOrder.buyer._id,
        type: "ORDER_BUYER_REAFFIRMED_PREFERENCE", // Make sure this is in Notification schema enum
        title: "Buyer Reaffirmed Time Preference",
        message: `${
            savedOrder.buyer.name || "The buyer"
          } for order (#${orderId.slice(
            -6
          )}) wishes to stick with their original time preference (${getTimePreferenceDisplay(
            originalTimePreferenceForNotification
          )}). Please review and Accept or Decline the order.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error(
          "[reaffirmOriginalTimePreference] Notify seller err:",
          err
        )
      );

      createAndDispatchNotification({
        // Notification to buyer
        recipientId: savedOrder.buyer._id,
        senderId: savedOrder.seller._id, // Or system ID
        type: "ORDER_PREFERENCE_REAFFIRMATION_SENT", // Make sure this is in Notification schema enum
        title: "Preference Reaffirmed",
        message: `You've reaffirmed your original time preference for order (#${orderId.slice(
          -6
        )}). The seller has been notified.`,
        link: `/user/orders/${savedOrder._id}`,
        relatedResource: savedOrder._id,
        relatedResourceType: "Order",
        io,
      }).catch((err) =>
        console.error(
          "[reaffirmOriginalTimePreference] Notify buyer (confirm) err:",
          err
        )
      );
    }

    // Update Conversation & Sockets
    if (savedOrder.seller?._id && savedOrder.buyer?._id && io) {
      const conversationMessage = `Buyer reaffirmed original time preference: ${getTimePreferenceDisplay(
        originalTimePreferenceForNotification
      )}. Awaiting seller's decision.`;

      const customConversationId = [
        savedOrder.buyer._id.toString(),
        savedOrder.seller._id.toString(),
      ]
        .sort()
        .join("_"); // This is your unique conversation thread ID

      await Conversation.findOneAndUpdate(
        { id: customConversationId }, // Query by your custom unique string ID
        {
          $set: {
            lastMessage: conversationMessage,
            updatedAt: new Date(),
            orderId: savedOrder._id, // Update the orderId context for this conversation thread
            // Potentially update readByBuyer, readBySeller
            readByBuyer: true, // Buyer took this action
            readBySeller: false, // Seller needs to see this
          },
          $setOnInsert: {
            // Only if a new conversation document is created
            id: customConversationId,
            buyerId: savedOrder.buyer._id,
            sellerId: savedOrder.seller._id,
            orderId: savedOrder._id,
            // Set initial read states if new
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
        .populate("sellerId buyerId", "name profilePicture") // Keep populate if needed by socket emit
        .then((convo) => {
          if (convo) {
            console.log(
              `[reaffirmOriginalTimePreference] Conversation ${convo.id} updated/upserted.`
            );
            const eventData = {
              ...convo.toObject(),
              orderStatus: savedOrder.status,
              orderId: savedOrder._id,
            };
            io.to(savedOrder.buyer._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
            io.to(savedOrder.seller._id.toString()).emit(
              "conversationUpdated",
              eventData
            );
          } else {
            console.warn(
              `[reaffirmOriginalTimePreference] findOneAndUpdate for conversation (id: ${customConversationId}) did not return a document.`
            );
          }
        })
        .catch((err) => {
          // If E11000 happens on 'id', it means your customConversationId generation isn't unique (highly unlikely if using sorted ObjectIds)
          // or there's a race condition. The error you saw was on 'orderId'.
          console.error(
            "[reaffirmOriginalTimePreference] Error upserting conversation:",
            err
          );
        });

      const orderUpdatePayload = {
        orderId: savedOrder._id,
        status: savedOrder.status,
        order: savedOrder.toObject({ depopulate: true }),
      };
      io.to(savedOrder.buyer._id.toString()).emit(
        "order_status_updated",
        orderUpdatePayload
      );
      io.to(savedOrder.seller._id.toString()).emit(
        "order_status_updated",
        orderUpdatePayload
      );
    }

    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "service buyer seller",
      "title name email profilePicture"
    ); // Adjust as needed
    res.status(200).json({
      message: "Original time preference reaffirmed. Seller notified.",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      `[reaffirmOriginalTimePreference] General Error for order ${orderId}:`,
      error.message,
      error.stack
    );
    if (error.code === 11000 && error.message.includes("conversations")) {
      // More specific check for E11000 on conversations
      return res.status(500).json({
        message:
          "Database conflict during conversation update. Please try again or contact support if it persists.",
      });
    }
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  createOrder,
  getOrders,
  confirmPayment,
  getOrderById,
  acceptOrder,
  proposeTimeChange, // NEW
  confirmTimeProposal, // NEW
  declineOrder,
  scheduleOrderSlot,
  markOrderInProgress, // << NEW
  markOrderCompleted, // << NEW
  requestOrderRefund, // << NEW
  deleteOrder,
  processRefundAfterDecline, // NEW
  findAnotherSellerForOrder, // NEW (placeholder)
  reaffirmOriginalTimePreference,
};
