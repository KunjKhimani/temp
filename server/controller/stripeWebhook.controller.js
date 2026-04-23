const crypto = require("crypto");
const Order = require("../model/order.model");
const {
  createAndDispatchNotification,
} = require("../services/notification.service");

const verifySquareSignature = (req) => {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const providedSignature = req.headers["x-square-hmacsha256-signature"];

  // Keep verification optional so existing environments don't break during rollout.
  if (!signatureKey) {
    console.warn(
      "[Square Webhook] SQUARE_WEBHOOK_SIGNATURE_KEY not set. Skipping signature verification."
    );
    return true;
  }

  if (!providedSignature) {
    return false;
  }

  const notificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ||
    `${process.env.SERVER_BASE_URL || ""}/api/square-webhook`;

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : JSON.stringify(req.body || {});

  const payload = notificationUrl + rawBody;
  const expectedSignature = crypto
    .createHmac("sha256", signatureKey)
    .update(payload)
    .digest("base64");

  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const parseSquareEvent = (req) => {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : JSON.stringify(req.body || {});

  return JSON.parse(rawBody);
};

const squareWebhookHandler = async (req, res) => {
  let event;

  try {
    const isValid = verifySquareSignature(req);
    if (!isValid) {
      return res.status(400).send("Webhook signature verification failed.");
    }

    event = parseSquareEvent(req);
  } catch (err) {
    console.error(`Square webhook parse/verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event?.type;
  console.log(`[Square Webhook] Received event: ${eventType}`);

  switch (eventType) {
    case "payment.updated": {
      const payment = event?.data?.object?.payment;
      if (!payment?.id) {
        console.warn("[Square Webhook] payment.updated without payment object.");
        break;
      }

      const paymentStatus = payment.status;
      const squareOrderId = payment.order_id;
      console.log(
        `[Square Webhook] Payment ${payment.id} status updated: ${paymentStatus}`
      );

      if (paymentStatus === "COMPLETED" || paymentStatus === "APPROVED") {
        try {
          let updatedOrder = null;

          if (squareOrderId) {
            updatedOrder = await Order.findOneAndUpdate(
              {
                _id: squareOrderId,
                status: "pending-payment",
              },
              {
                $set: {
                  status: "awaiting-seller-confirmation",
                },
              },
              { new: true }
            );
          }

          // Fallback to payment ID mapping, preserving previous webhook behavior.
          if (!updatedOrder) {
            updatedOrder = await Order.findOneAndUpdate(
              {
                paymentIntentId: payment.id,
                status: "pending-payment",
              },
              {
                $set: {
                  status: "awaiting-seller-confirmation",
                },
              },
              { new: true }
            );
          }

          if (updatedOrder) {
            console.log(
              `✅ [Square payment.updated webhook] Order ${updatedOrder._id} status updated to awaiting-seller-confirmation.`
            );
            await createAndDispatchNotification({
              userId: updatedOrder.seller,
              type: "ORDER_PAYMENT_SUCCEEDED",
              message: `A buyer has completed payment for an order. Order ID: ${updatedOrder._id}.`,
              link: `/user/orders/${updatedOrder._id}`,
            });
            console.log(
              `✅ [Square payment.updated webhook] Notification dispatched to seller for order ${updatedOrder._id}.`
            );

            await createAndDispatchNotification({
              userId: updatedOrder.buyer,
              type: "ORDER_PAYMENT_CONFIRMED_BUYER",
              message: `Your payment for order ${updatedOrder._id} was successful.`,
              link: `/user/orders/${updatedOrder._id}`,
            });
            console.log(
              `✅ [Square payment.updated webhook] Notification dispatched to buyer for order ${updatedOrder._id}.`
            );
          } else {
            console.warn(
              `⚠️ [Square payment.updated webhook] Order not found or already updated for payment ${payment.id}.`
            );
          }
        } catch (error) {
          console.error(
            `❌ [Square payment.updated webhook] Error processing payment ${payment.id}:`,
            error.message,
            error.stack
          );
        }
      }

      if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
        console.log(`[Square Webhook] Payment ${payment.id} failed/canceled.`);
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event?.data?.object?.invoice;
      const subscriptionId = invoice?.subscription_id;
      
      if (!subscriptionId) {
        console.log("[Square Webhook] invoice.payment_succeeded without subscriptionId. Skipping order creation.");
        break;
      }

      console.log(`[Square Webhook] Recurring payment succeeded for subscription ${subscriptionId}`);

      try {
        const ServiceSubscription = require("../model/serviceSubscription.model");
        const Order = require("../model/order.model");

        const sub = await ServiceSubscription.findOne({ squareSubscriptionId: subscriptionId });
        if (!sub) {
          console.error(`[Square Webhook] No ServiceSubscription found for Square ID ${subscriptionId}`);
          break;
        }

        // Create a NEW order for this cycle
        const newOrder = await Order.create({
          service: sub.service,
          buyer: sub.buyer,
          seller: sub.seller,
          totalPrice: sub.amount,
          status: "awaiting-seller-confirmation",
          paymentIntentId: invoice.id, // Using invoice ID as payment reference
          subscriptionId: sub._id,
          isRecurring: true
        });

        console.log(`✅ [Square Webhook] Created recurring order ${newOrder._id} for subscription ${sub._id}`);

        // Update subscription record
        sub.lastOrderDate = new Date();
        sub.nextBillingDate = invoice.next_payment_at; // Update if available in payload
        await sub.save();

        // Notify parties
        await createAndDispatchNotification({
          recipientId: sub.seller,
          type: "SERVICE_SUBSCRIPTION_RECURRING_ORDER_SELLER",
          title: "New Recurring Order",
          message: `You have a new recurring order from a subscriber. Order ID: ${newOrder._id}.`,
          link: `/user/orders/${newOrder._id}`,
          relatedResource: newOrder._id,
          relatedResourceType: "Order"
        });

        await createAndDispatchNotification({
          recipientId: sub.buyer,
          type: "SERVICE_SUBSCRIPTION_PAYMENT_SUCCESS_BUYER",
          title: "Recurring Payment Successful",
          message: `Your recurring payment was successful and a new order has been created. Order ID: ${newOrder._id}.`,
          link: `/user/orders/${newOrder._id}`,
          relatedResource: newOrder._id,
          relatedResourceType: "Order"
        });

      } catch (error) {
        console.error(`❌ [Square Webhook] Error processing recurring payment:`, error.message);
      }
      break;
    }

    default:
      console.log(`[Square Webhook] Unhandled event type ${eventType}`);
  }

  res.status(200).json({ received: true });
};

module.exports = {
  squareWebhookHandler,
};
