// controllers/productOrder.controller.js
const mongoose = require("mongoose");
const ProductOrder = require("../model/productOrder.model");
const Product = require("../model/product.model"); // Your existing Product model
const SpecialOffer = require("../model/specialOffer.model");
const User = require("../model/user.model");
const PaymentSplit = require("../model/paymentSplit.model");
const { refundPayment, createPayment, completePayment } = require("../utils/squareService");
const { getCommissionRates, calculateDynamicCommission } = require("../utils/promotionHelper");
const TransactionLog = require("../model/TransactionLog.model");
const {
  createAndDispatchNotification,
} = require("../services/notification.service"); // If using notifications

const PRODUCT_PLATFORM_FEE_RATE = 0.2;

const formatUsd = (amount) => Number(amount || 0).toFixed(2);

const formatUsdFromCents = (amountInCents) =>
  (Number(amountInCents || 0) / 100).toFixed(2);

// --- CREATE PRODUCT ORDER ---
const createProductOrder = async (req, res) => {
  try {
    const { items, shippingAddress, additionalInfo } = req.body;
    const buyerId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Order must contain at least one product item." });
    }
    if (
      !shippingAddress ||
      typeof shippingAddress !== "object" ||
      !shippingAddress.name ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state || // Added state validation
      !shippingAddress.country ||
      !shippingAddress.postalCode
    ) {
      return res.status(400).json({
        message:
          "Complete shipping address (name, street, city, state, country, postalCode) is required.",
      });
    }

    let orderSubTotal = 0;
    const processedOrderItems = [];
    let determinedSellerId = null;
    const productStockUpdates = [];

    for (let i = 0; i < items.length; i++) {
      const cartItem = items[i];
      if (
        !cartItem.productId ||
        !cartItem.quantity ||
        Number(cartItem.quantity) < 1
      ) {
        return res.status(400).json({
          message: `Invalid data for item ${i + 1
            }. Product ID and valid quantity required.`,
        });
      }

      const product = await Product.findById(cartItem.productId)
        .populate("createdBy", "_id")
        .populate("specialOffer");

      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${cartItem.productId} not found.`,
        });
      }
      if (
        product.status !== "active" ||
        product.stock < Number(cartItem.quantity)
      ) {
        return res.status(400).json({
          message: `Product "${product.name}" is unavailable or has insufficient stock (Available: ${product.stock}, Requested: ${cartItem.quantity}).`,
        });
      }
      if (product.createdBy._id.toString() === buyerId.toString()) {
        return res.status(400).json({
          message: `You cannot order your own product: "${product.name}".`,
        });
      }

      const currentItemSellerId = product.createdBy._id.toString();
      if (i === 0) {
        determinedSellerId = currentItemSellerId;
      } else if (determinedSellerId !== currentItemSellerId) {
        return res.status(400).json({
          message:
            "All products in this order must be from the same seller. Please create separate orders.",
        });
      }

      processedOrderItems.push({
        product: product._id,
        quantity: Number(cartItem.quantity),
        priceAtOrder: product.price,
        nameAtOrder: product.name,
        isSpecial: product.isSpecial,
        specialOffer: product.specialOffer?._id,
        actualPriceAtOrder: product.specialOffer?.actualPrice,
        isCommunity: product.isCommunity,
        subcategory: product.subcategory,
      });
      orderSubTotal += product.price * Number(cartItem.quantity);
      productStockUpdates.push({
        productId: product._id,
        quantityToDecrement: Number(cartItem.quantity),
      });
    }

    if (!determinedSellerId) {
      return res
        .status(500)
        .json({ message: "Could not determine seller for the order." });
    }

    // Placeholder for shipping fee calculation
    const calculatedShippingFee = 5.0;
    const orderTotalPrice = orderSubTotal + calculatedShippingFee;
    // Calculate expected split using centralized dynamic logic
    const { adminCommission: expectedAdminFee, sellerCommission: expectedSellerShare } = await calculateDynamicCommission(
      orderTotalPrice,
      { items: processedOrderItems }, // Mimic order structure for promotion level detection
      "product"
    );
    console.log("[ProductPaymentAudit] ========================================");
    console.log("[ProductPaymentAudit] Stage: CREATE_PRODUCT_ORDER");
    console.log(
      `[ProductPaymentAudit] Buyer: ${buyerId.toString()} | Seller: ${determinedSellerId}`
    );
    console.log(
      `[ProductPaymentAudit] Amounts -> subTotal: USD ${formatUsd(
        orderSubTotal
      )}, shipping: USD ${formatUsd(calculatedShippingFee)}, total: USD ${formatUsd(
        orderTotalPrice
      )}`
    );
    console.log(
      `[ProductPaymentAudit] Expected split (20/80) -> admin: USD ${formatUsd(
        expectedAdminFee
      )}, seller: USD ${formatUsd(expectedSellerShare)}`
    );
    console.log(
      "[ProductPaymentAudit] Current product flow status -> admin 20% is NOT being sent at create step."
    );
    console.log("[ProductPaymentAudit] ========================================");
    const minimumAmount = 0.5; // Stripe minimum
    if (orderTotalPrice < minimumAmount) {
      return res.status(400).json({
        message: `Total price must be at least $${minimumAmount.toFixed(2)}.`,
      });
    }

    const pendingPaymentId = `pending_${new mongoose.Types.ObjectId().toString()}`;

    const newProductOrderData = {
      items: processedOrderItems,
      buyer: buyerId,
      seller: determinedSellerId,
      shippingAddress,
      subTotal: parseFloat(orderSubTotal.toFixed(2)),
      shippingFee: parseFloat(calculatedShippingFee.toFixed(2)),
      totalPrice: parseFloat(orderTotalPrice.toFixed(2)),
      additionalInfo: additionalInfo || undefined,
      paymentIntentId: pendingPaymentId,
      paymentIntentClientSecret: "square_pending",
      status: "pending-payment",
    };

    const productOrder = new ProductOrder(newProductOrderData);
    const savedProductOrder = await productOrder.save();

    // Create transaction log for product order attempt
    try {
      await TransactionLog.create({
        buyer: savedProductOrder.buyer,
        seller: savedProductOrder.seller,
        type: "product",
        purchasedItem: savedProductOrder._id,
        itemModel: "ProductOrder",
        totalAmount: savedProductOrder.totalPrice,
        sellerCommission: 0, // Will be calculated on payment confirmation
        adminCommission: 0, // Will be calculated on payment confirmation
        status: "pending", // Order is pending payment
        paymentProvider: "Square",
        transactionId: savedProductOrder.paymentIntentId,
        isSpecial: savedProductOrder.items.some(item => item.isSpecial),
        specialOffer: savedProductOrder.items.find(item => item.isSpecial)?.specialOffer,
        isCommunity: savedProductOrder.items.some(item => item.isCommunity),
        metadata: {
          orderAttempt: true,
          orderStatus: savedProductOrder.status,
          itemCount: savedProductOrder.items.length
        }
      });
      console.log(`[createProductOrder] TransactionLog created for product order attempt ${savedProductOrder._id}`);
    } catch (logError) {
      console.error(`[createProductOrder] Failed to create TransactionLog:`, logError);
    }

    // Update PaymentIntent metadata with the actual order ID
    // This is good practice for reconciliation.
    // await updatePaymentIntent(savedProductOrder.paymentIntentId, {
    //   metadata: { ...stripeMetadata, product_order_id: savedProductOrder._id.toString() }
    // });

    const responseOrder = {
      _id: savedProductOrder._id,
      items: savedProductOrder.items.map((it) => ({
        productId: it.product.toString(),
        name: it.nameAtOrder,
        quantity: it.quantity,
        price: it.priceAtOrder,
      })),
      shippingAddress: savedProductOrder.shippingAddress,
      subTotal: savedProductOrder.subTotal,
      shippingFee: savedProductOrder.shippingFee,
      totalPrice: savedProductOrder.totalPrice,
      status: savedProductOrder.status,
      createdAt: savedProductOrder.createdAt,
      paymentIntentId: savedProductOrder.paymentIntentId,
    };

    res.status(201).json({
      message: "Product order created. Please proceed to payment.",
      order: responseOrder,
      paymentProvider: "square",
      square: {
        amount: Math.round(savedProductOrder.totalPrice * 100),
        currency: "USD",
      },
    });
  } catch (error) {
    console.error("[createProductOrder] Error:", error.message, error.stack);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((el) => el.message);
      return res.status(400).json({
        message: messages.join(". ") || "Order validation failed.",
        errors: error.errors,
      });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error creating product order." });
  }
};

// --- CONFIRM PRODUCT ORDER PAYMENT ---
const confirmProductOrderPayment = async (req, res) => {
  const { orderId } = req.params;
  const { sourceId, idempotencyKey } = req.body;
  const userId = req.user._id; // Buyer ID

  try {
    if (!orderId || !sourceId) {
      return res.status(400).json({
        message: "Payment sourceId and Product Order ID are required",
      });
    }

    const productOrder = await ProductOrder.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "name email pushTokens _id")
      .populate({ path: "items.product", select: "name isCommunity subcategory" }); // For notifications and commission logic

    if (!productOrder)
      return res.status(404).json({ message: "Product order not found" });
    if (productOrder.buyer._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to confirm this payment" });
    }
    if (productOrder.status !== "pending-payment") {
      return res.status(400).json({
        message: `Order status (${productOrder.status}) does not allow payment confirmation.`,
      });
    }

    const amountInCents = Math.round(productOrder.totalPrice * 100);
    const expectedPlatformFeePercent = PRODUCT_PLATFORM_FEE_RATE;
    const expectedAdminFeeCents = Math.round(
      amountInCents * expectedPlatformFeePercent
    );
    const expectedSellerShareCents = amountInCents - expectedAdminFeeCents;
    console.log("[ProductPaymentAudit] ========================================");
    console.log(
      "[ProductPaymentAudit] Stage: CONFIRM_PRODUCT_PAYMENT (BEFORE createPayment)"
    );
    console.log(
      `[ProductPaymentAudit] Order: ${productOrder._id.toString()} | Buyer: ${productOrder.buyer._id.toString()} | Seller: ${productOrder.seller._id.toString()}`
    );
    console.log(
      `[ProductPaymentAudit] Charged total -> ${amountInCents} cents (USD ${formatUsdFromCents(
        amountInCents
      )})`
    );
    console.log(
      `[ProductPaymentAudit] Expected split (20/80) -> admin: ${expectedAdminFeeCents} cents (USD ${formatUsdFromCents(
        expectedAdminFeeCents
      )}), seller: ${expectedSellerShareCents} cents (USD ${formatUsdFromCents(
        expectedSellerShareCents
      )})`
    );
    console.log(
      "[ProductPaymentAudit] About to call Square createPayment WITHOUT app_fee_money (so admin 20% is not sent by this call)."
    );
    console.log("[ProductPaymentAudit] ========================================");

    const createPaymentResp = await createPayment({
      sourceId,
      amount: amountInCents,
      currency: "USD",
      idempotencyKey:
        idempotencyKey || `po-${productOrder._id.toString()}-${Date.now().toString().slice(-8)}`,
      autocomplete: false,
      note: `Product order ${productOrder._id.toString()}`,
    });

    const actualSquareAppFeeCents =
      createPaymentResp?.payment?.app_fee_money?.amount ?? null;
    const appFeeMatchesExpected20 =
      actualSquareAppFeeCents === expectedAdminFeeCents;
    const adminFeeActuallyApplied =
      typeof actualSquareAppFeeCents === "number" && actualSquareAppFeeCents > 0;
    console.log("[ProductPaymentAudit] ========================================");
    console.log(
      "[ProductPaymentAudit] Stage: CONFIRM_PRODUCT_PAYMENT (AFTER createPayment)"
    );
    console.log(
      `[ProductPaymentAudit] Order: ${productOrder._id.toString()} | SquarePaymentId: ${createPaymentResp?.payment?.id || "N/A"
      }`
    );
    console.log(
      `[ProductPaymentAudit] Square app_fee_money -> cents: ${actualSquareAppFeeCents === null ? "null" : actualSquareAppFeeCents
      }, usd: ${actualSquareAppFeeCents === null
        ? "null"
        : formatUsdFromCents(actualSquareAppFeeCents)
      }`
    );
    console.log(
      `[ProductPaymentAudit] Expected admin 20% -> ${expectedAdminFeeCents} cents (USD ${formatUsdFromCents(
        expectedAdminFeeCents
      )})`
    );
    console.log(
      `[ProductPaymentAudit] Verdict -> admin fee applied: ${adminFeeActuallyApplied ? "YES" : "NO"} | exact 20% match: ${appFeeMatchesExpected20 ? "YES" : "NO"}`
    );
    console.log("[ProductPaymentAudit] ========================================");

    const paymentId = createPaymentResp?.payment?.id;
    if (!paymentId) {
      return res.status(400).json({ message: "Payment creation failed." });
    }

    const completeResp = await completePayment(paymentId);
    const paymentStatus = completeResp?.payment?.status;

    if (paymentStatus === "COMPLETED") {
      // Decrement stock for each product in the order
      for (const item of productOrder.items) {
        const productToUpdate = await Product.findById(item.product);
        if (productToUpdate) {
          productToUpdate.stock -= item.quantity;
          // Ensure stock doesn't go below zero, though validation should prevent this earlier
          if (productToUpdate.stock < 0) productToUpdate.stock = 0;
          await productToUpdate.save();
          console.log(
            `[confirmProductOrderPayment] Decremented stock for product ${item.product} by ${item.quantity}`
          );
        } else {
          console.warn(
            `[confirmProductOrderPayment] Product ${item.product} not found during stock decrement for order ${productOrder._id}.`
          );
        }
      }

      productOrder.paymentIntentId = paymentId;
      productOrder.paymentIntentClientSecret = "square_completed";
      productOrder.status = "awaiting-seller-confirmation";
      productOrder.paymentTimestamp = new Date();
      const savedProductOrder = await productOrder.save();

      try {
        await PaymentSplit.findOneAndUpdate(
          {
            orderType: "product_order",
            orderId: savedProductOrder._id,
          },
          {
            $set: {
              buyer: savedProductOrder.buyer?._id,
              seller: savedProductOrder.seller?._id,
              totalAmount: savedProductOrder.totalPrice,
              currency: "USD",
              platformFeePercent: PRODUCT_PLATFORM_FEE_RATE,
              adminAmountExpected: adminCommission,
              sellerAmountExpected: sellerCommissionLog,
              adminAmountActual:
                typeof actualSquareAppFeeCents === "number"
                  ? Number((actualSquareAppFeeCents / 100).toFixed(2))
                  : 0,
              sellerAmountActual: Number(
                (
                  savedProductOrder.totalPrice -
                  (typeof actualSquareAppFeeCents === "number"
                    ? actualSquareAppFeeCents / 100
                    : 0)
                ).toFixed(2)
              ),
              isSplitApplied:
                typeof actualSquareAppFeeCents === "number" &&
                actualSquareAppFeeCents > 0,
              paymentProvider: "square",
              paymentReferenceId: paymentId,
              notes:
                "Saved for audit/demo. Product flow currently does not enforce 20% app fee by default.",
              snapshot: {
                amountInCents,
                expectedAdminFeeCents,
                expectedSellerShareCents,
                actualSquareAppFeeCents,
                appFeeMatchesExpected20,
                adminAmountExpected: Number(
                (savedProductOrder.totalPrice * PRODUCT_PLATFORM_FEE_RATE).toFixed(
                  2
                )
              ),
              },
            },
          },
          { upsert: true, new: true }
        );
      } catch (splitError) {
        console.error(
          `[confirmProductOrderPayment] Error updating PaymentSplit for order ${savedProductOrder._id}:`,
          splitError.message
        );
      }

      // --- CALCULATE AND LOG COMMISSION (Dynamic from Database) ---
      const { adminCommission, sellerCommission: sellerCommissionLog, level } = await calculateDynamicCommission(
        savedProductOrder.totalPrice,
        savedProductOrder,
        "product"
      );

      try {
        // Determine if this order involved any special offers for logging
        const hasSpecialItems = savedProductOrder.items.some(item => item.isSpecial);
        const firstSpecialOffer = savedProductOrder.items.find(item => item.isSpecial)?.specialOffer;

        await TransactionLog.findOneAndUpdate(
          { 
            purchasedItem: savedProductOrder._id, 
            itemModel: "ProductOrder",
            status: "pending" 
          },
          {
            $set: {
              sellerCommission: sellerCommissionLog,
              adminCommission: adminCommission,
              status: "succeeded",
              paymentProvider: "Square",
              transactionId: paymentId,
              isSpecial: hasSpecialItems,
              specialOffer: firstSpecialOffer,
              isCommunity: level === 'community',
              metadata: {
                ...savedProductOrder.metadata,
                paidAt: new Date(),
                confirmationAttempt: true
              }
            }
          },
          { upsert: true } // Fallback to create if somehow the pending log is missing
        );
        console.log(`[confirmProductOrderPayment] Transaction logged for order ${savedProductOrder._id}`);
      } catch (logError) {
        console.error(`[confirmProductOrderPayment] Error logging transaction for order ${savedProductOrder._id}:`, logError.message);
      }

      const io = req.app.get("socketio");

      const firstProductName =
        savedProductOrder.items[0]?.product?.name ||
        savedProductOrder.items[0]?.nameAtOrder ||
        "products";
      const orderSummaryText = `${firstProductName}${savedProductOrder.items.length > 1 ? " and others" : ""
        }`;
      const orderDisplayId = savedProductOrder._id.toString().slice(-6);

      if (savedProductOrder.seller?._id && savedProductOrder.buyer?._id) {
        createAndDispatchNotification({
          recipientId: savedProductOrder.seller._id,
          senderId: savedProductOrder.buyer._id,
          type: "NEW_PRODUCT_ORDER_SELLER",
          title: "New Product Order!",
          message: `${savedProductOrder.buyer.name || "A buyer"
            } placed an order (#${orderDisplayId}) for ${orderSummaryText}. Please confirm.`,
          link: `/user/product-orders/${savedProductOrder._id}`,
          relatedResource: savedProductOrder._id,
          relatedResourceType: "ProductOrder",
          io,
        }).catch((err) =>
          console.error(
            "Error sending new product order notification to seller:",
            err
          )
        );
      }
      if (savedProductOrder.buyer?._id) {
        createAndDispatchNotification({
          recipientId: savedProductOrder.buyer._id,
          type: "PRODUCT_ORDER_PAYMENT_CONFIRMED_BUYER",
          title: "Payment Confirmed!",
          message: `Your payment for order (#${orderDisplayId}) for ${orderSummaryText} is confirmed. Awaiting seller confirmation.`,
          link: `/user/product-orders/${savedProductOrder._id}`,
          relatedResource: savedProductOrder._id,
          relatedResourceType: "ProductOrder",
          io,
        }).catch((err) =>
          console.error(
            "Error sending product payment confirmed notification to buyer:",
            err
          )
        );
      }

      const fullyPopulatedOrder = await ProductOrder.findById(
        savedProductOrder._id
      )
        .populate({
          path: "items.product",
          select: "name images price sku category brand",
        })
        .populate("buyer", "name email profilePicture")
        .populate("seller", "name email profilePicture companyName");

      return res.status(200).json({
        message: "Payment confirmed. Awaiting seller confirmation.",
        order: fullyPopulatedOrder,
      });
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
      productOrder.status = "payment-failed"; // Or keep as pending-payment
      await productOrder.save();
      // If stock was decremented, consider restoring it here or have a cleanup job.
      // For now, createOrder decrements stock *before* PI is confirmed by client.
      // This is an area that might need refinement based on exact stock reservation strategy.
      return res.status(400).json({
        message: `Payment not completed. Status: ${paymentStatus}. Please try again or use a different payment method.`,
        status: paymentStatus,
      });
    } else {
      productOrder.status = "payment-failed";
      await productOrder.save();
      return res.status(400).json({
        message: `Payment not successful. Status: ${paymentStatus || "UNKNOWN"}`,
        status: paymentStatus || "UNKNOWN",
      });
    }
  } catch (error) {
    console.error(
      `Error confirming product order payment (${req.params?.orderId}):`,
      error.message,
      error.stack
    );

    // Provide more descriptive error if it comes from Square
    const squareError = error.response?.data?.errors || error.response?.data || null;

    return res.status(500).json({ 
      message: "Internal Server Error during payment confirmation.",
      error: error.message,
      squareError: squareError 
    });
  }
};

// --- GET PRODUCT ORDERS (for buyer or seller) ---
const getProductOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      role,
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt_desc",
    } = req.query;

    let queryFilter = {};
    if (role === "seller" && req.user.isSeller) {
      queryFilter.seller = userId;
    } else if (role === "buyer") {
      queryFilter.buyer = userId;
    } else {
      // Default to buyer if role not specified or invalid, or if user not seller trying to access seller role
      queryFilter.buyer = userId;
    }

    if (status) {
      queryFilter.status = status;
    }

    const sortOptions = {};
    if (sortBy === "createdAt_desc") sortOptions.createdAt = -1;
    else if (sortBy === "createdAt_asc") sortOptions.createdAt = 1;
    else if (sortBy === "totalPrice_desc") sortOptions.totalPrice = -1;
    else if (sortBy === "totalPrice_asc") sortOptions.totalPrice = 1;
    else sortOptions.createdAt = -1;

    const count = await ProductOrder.countDocuments(queryFilter);
    const productOrders = await ProductOrder.find(queryFilter)
      .populate({ path: "items.product", select: "name images price sku" })
      .populate("buyer", "name profilePicture _id") // Ensure _id is populated
      .populate("seller", "name profilePicture companyName _id") // Ensure _id is populated
      .sort(sortOptions)
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .lean(); // Use lean for performance on lists

    res.status(200).json({
      orders: productOrders,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching product orders:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error fetching product orders." });
  }
};

// --- GET SINGLE PRODUCT ORDER BY ID ---
const getProductOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID format." });
    }

    const productOrder = await ProductOrder.findById(orderId)
      .populate({
        path: "items.product",
        select: "name images price sku description category brand createdBy",
      }) // Add createdBy to product
      .populate("buyer", "name email profilePicture _id")
      .populate("seller", "name email profilePicture companyName _id");

    if (!productOrder)
      return res.status(404).json({ message: "Product order not found." });

    if (
      productOrder.buyer._id.toString() !== userId.toString() &&
      productOrder.seller._id.toString() !== userId.toString() &&
      !req.user.isAdmin // Allow admin access
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view this order." });
    }
    res.status(200).json(productOrder);
  } catch (error) {
    console.error(
      "Error fetching product order by ID:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error fetching product order." });
  }
};

// --- SELLER: CONFIRM PRODUCT ORDER ---
const sellerConfirmProductOrder = async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user._id;

  try {
    const productOrder = await ProductOrder.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "_id")
      .populate({ path: "items.product", select: "name" });

    if (!productOrder)
      return res.status(404).json({ message: "Product order not found." });
    if (productOrder.seller._id.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to confirm this order." });
    }
    if (productOrder.status !== "awaiting-seller-confirmation") {
      return res.status(400).json({
        message: `Order status is "${productOrder.status}", cannot confirm at this stage.`,
      });
    }

    productOrder.status = "seller-confirmed";
    productOrder.sellerConfirmationTimestamp = new Date();
    const savedProductOrder = await productOrder.save();
    const io = req.app.get("socketio");

    const firstProductName =
      savedProductOrder.items[0]?.product?.name ||
      savedProductOrder.items[0]?.nameAtOrder ||
      "products";
    const orderSummaryText = `${firstProductName}${savedProductOrder.items.length > 1 ? " and others" : ""
      }`;
    const orderDisplayId = savedProductOrder._id.toString().slice(-6);

    if (savedProductOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedProductOrder.buyer._id,
        senderId: sellerId,
        type: "PRODUCT_ORDER_SELLER_CONFIRMED_BUYER",
        title: "Order Confirmed!",
        message: `Your order (#${orderDisplayId}) for ${orderSummaryText} has been confirmed by the seller and is being processed.`,
        link: `/user/product-orders/${savedProductOrder._id}`,
        relatedResource: savedProductOrder._id,
        relatedResourceType: "ProductOrder",
        io,
      }).catch((err) =>
        console.error(
          "Error sending order confirmed notification to buyer:",
          err
        )
      );
    }

    const fullyPopulatedOrder = await ProductOrder.findById(
      savedProductOrder._id
    )
      .populate({
        path: "items.product",
        select: "name images price sku category brand",
      })
      .populate("buyer", "name email profilePicture")
      .populate("seller", "name email profilePicture companyName");

    res.status(200).json({
      message: "Product order confirmed successfully. Ready for processing.",
      order: fullyPopulatedOrder,
    });
  } catch (error) {
    console.error(
      "[sellerConfirmProductOrder] Error:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error confirming product order." });
  }
};

// --- SELLER: DECLINE PRODUCT ORDER (after payment) ---
const sellerDeclineProductOrder = async (req, res) => {
  const { orderId } = req.params;
  const { declineReason } = req.body;
  const sellerId = req.user._id;

  try {
    if (!declineReason || declineReason.trim() === "") {
      return res
        .status(400)
        .json({ message: "A reason for declining the order is required." });
    }

    const productOrder = await ProductOrder.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "_id")
      .populate({ path: "items.product", select: "name" }); // For notification message

    if (!productOrder) {
      return res.status(404).json({ message: "Product order not found." });
    }
    if (productOrder.seller._id.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to decline this order." });
    }
    if (
      ![
        "awaiting-seller-confirmation",
        "seller-confirmed",
        "processing",
      ].includes(productOrder.status)
    ) {
      return res.status(400).json({
        message: `Order status is "${productOrder.status}", cannot decline at this stage.`,
      });
    }

    // Attempt to refund payment via Square
    let refundAttempted = false;
    if (productOrder.paymentIntentId) {
      refundAttempted = true;
      const refundResult = await refundPayment({
        paymentId: productOrder.paymentIntentId,
        amount: Math.round(productOrder.totalPrice * 100),
        currency: "USD",
        idempotencyKey: `refund-${productOrder._id.toString()}-${Date.now()}`,
        reason: `Seller declined order: ${declineReason}`,
      });
      if (!refundResult?.refund?.id) {
        productOrder.internalNotes =
          (productOrder.internalNotes || "") +
          `\nSquare refund failed/pending for payment ${productOrder.paymentIntentId
          }: ${refundResult?.errors?.[0]?.detail || "Unknown error"
          }.`;
        console.error(
          `[sellerDeclineProductOrder] CRITICAL: Square refund failed for payment ${productOrder.paymentIntentId}. Order ${productOrder._id}.`
        );
      } else {
        productOrder.refundDetails = {
          refundId: refundResult.refund.id,
          amount: (refundResult.refund.amount_money?.amount || 0) / 100,
          reason: `Seller declined: ${declineReason}`,
          status: refundResult.refund.status,
          processedAt: new Date(),
        };
      }
    } else {
      productOrder.internalNotes =
        (productOrder.internalNotes || "") +
        "\nNo PaymentIntentId found for refund attempt during seller decline.";
    }

    productOrder.status = "declined-by-seller";
    productOrder.declineReason = declineReason;
    productOrder.cancellationTimestamp = new Date();

    // Restore stock (within transaction)
    for (const item of productOrder.items) {
      const productToUpdate = await Product.findById(item.product);
      if (productToUpdate) {
        productToUpdate.stock += item.quantity;
        await productToUpdate.save();
        console.log(
          `[sellerDeclineProductOrder] Restored stock for product ${item.product} by ${item.quantity}`
        );
      } else {
        console.warn(
          `[sellerDeclineProductOrder] Product ${item.product} not found during stock restoration for order ${productOrder._id}.`
        );
      }
    }

    const savedProductOrder = await productOrder.save();

    const io = req.app.get("socketio");
    const firstProductName =
      savedProductOrder.items[0]?.product?.name ||
      savedProductOrder.items[0]?.nameAtOrder ||
      "products";
    const orderSummaryText = `${firstProductName}${savedProductOrder.items.length > 1 ? " and others" : ""
      }`;
    const orderDisplayId = savedProductOrder._id.toString().slice(-6);

    if (savedProductOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedProductOrder.buyer._id,
        senderId: sellerId,
        type: "PRODUCT_ORDER_SELLER_DECLINED_BUYER",
        title: "Order Declined",
        message: `Unfortunately, your order (#${orderDisplayId}) for ${orderSummaryText} was declined by the seller. Reason: ${declineReason}. ${refundAttempted
            ? "A refund is being processed."
            : "Please contact support regarding payment."
          }`,
        link: `/user/product-orders/${savedProductOrder._id}`,
        relatedResource: savedProductOrder._id,
        relatedResourceType: "ProductOrder",
        io,
      }).catch((err) =>
        console.error(
          "Error sending order declined notification to buyer:",
          err
        )
      );
    }

    const fullyPopulatedOrder = await ProductOrder.findById(
      savedProductOrder._id
    )
      .populate({
        path: "items.product",
        select: "name images price sku category brand",
      })
      .populate("buyer", "name email profilePicture")
      .populate("seller", "name email profilePicture companyName");

    res.status(200).json({
      message:
        "Product order declined. Refund processed (if applicable) and stock restored.",
      order: fullyPopulatedOrder,
    });
  } catch (error) {
    console.error(
      "[sellerDeclineProductOrder] Error:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error declining product order." });
  }
};

// --- SELLER: UPDATE SHIPMENT DETAILS / SHIP PRODUCT ORDER ---
const shipProductOrder = async (req, res) => {
  const { orderId } = req.params;
  const { trackingNumber, shippingCarrier } = req.body;
  const sellerId = req.user._id;

  try {
    if (!trackingNumber || !shippingCarrier) {
      return res.status(400).json({
        message: "Tracking number and shipping carrier are required.",
      });
    }

    const productOrder = await ProductOrder.findById(orderId)
      .populate("buyer", "name email pushTokens _id")
      .populate("seller", "_id")
      .populate({ path: "items.product", select: "name" });

    if (!productOrder)
      return res.status(404).json({ message: "Product order not found." });
    if (productOrder.seller._id.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to ship this order." });
    }
    // Allow shipping if seller-confirmed or already processing
    if (!["seller-confirmed", "processing"].includes(productOrder.status)) {
      return res.status(400).json({
        message: `Order status is "${productOrder.status}", cannot mark as shipped at this stage.`,
      });
    }

    productOrder.status = "shipped";
    productOrder.trackingNumber = trackingNumber;
    productOrder.shippingCarrier = shippingCarrier;
    productOrder.shippedTimestamp = new Date();
    // You might also want to update a processingTimestamp if moving from seller-confirmed to shipped directly
    if (
      !productOrder.processingTimestamp &&
      productOrder.status === "seller-confirmed"
    ) {
      productOrder.processingTimestamp = new Date(); // Mark as processed now it's being shipped
    }

    const savedProductOrder = await productOrder.save();
    const io = req.app.get("socketio");

    const firstProductName =
      savedProductOrder.items[0]?.product?.name ||
      savedProductOrder.items[0]?.nameAtOrder ||
      "products";
    const orderSummaryText = `${firstProductName}${savedProductOrder.items.length > 1 ? " and others" : ""
      }`;
    const orderDisplayId = savedProductOrder._id.toString().slice(-6);

    if (savedProductOrder.buyer?._id) {
      createAndDispatchNotification({
        recipientId: savedProductOrder.buyer._id,
        senderId: sellerId,
        type: "PRODUCT_ORDER_SHIPPED_BUYER",
        title: "Your Order Has Shipped!",
        message: `Your order (#${orderDisplayId}) for ${orderSummaryText} has shipped! Tracking: ${shippingCarrier} - ${trackingNumber}.`,
        link: `/user/product-orders/${savedProductOrder._id}`,
        relatedResource: savedProductOrder._id,
        relatedResourceType: "ProductOrder",
        io,
      }).catch((err) =>
        console.error("Error sending order shipped notification to buyer:", err)
      );
    }

    const fullyPopulatedOrder = await ProductOrder.findById(
      savedProductOrder._id
    )
      .populate({
        path: "items.product",
        select: "name images price sku category brand",
      })
      .populate("buyer", "name email profilePicture")
      .populate("seller", "name email profilePicture companyName");

    res.status(200).json({
      message: "Product order marked as shipped and tracking details updated.",
      order: fullyPopulatedOrder,
    });
  } catch (error) {
    console.error("[shipProductOrder] Error:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error updating shipment details." });
  }
};

// --- BUYER: MARK ORDER AS DELIVERED ---
const buyerMarkOrderDelivered = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user._id;

  try {
    const productOrder = await ProductOrder.findById(orderId)
      .populate("seller", "name email pushTokens _id")
      .populate("buyer", "_id")
      .populate({ path: "items.product", select: "name" });

    if (!productOrder)
      return res.status(404).json({ message: "Product order not found." });
    if (productOrder.buyer._id.toString() !== buyerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order." });
    }
    if (!["shipped", "out-for-delivery"].includes(productOrder.status)) {
      return res.status(400).json({
        message: `Order status is "${productOrder.status}". Cannot mark as delivered yet.`,
      });
    }

    productOrder.status = "delivered";
    productOrder.deliveredTimestamp = new Date();
    // Consider moving to 'completed' after a return/dispute window, not immediately on delivery.
    // productOrder.completionTimestamp = new Date();

    const savedProductOrder = await productOrder.save();
    const io = req.app.get("socketio");

    const firstProductName =
      savedProductOrder.items[0]?.product?.name ||
      savedProductOrder.items[0]?.nameAtOrder ||
      "products";
    const orderSummaryText = `${firstProductName}${
      savedProductOrder.items.length > 1 ? " and others" : ""
    }`;
    const orderDisplayId = savedProductOrder._id.toString().slice(-6);

    if (savedProductOrder.seller?._id) {
      createAndDispatchNotification({
        recipientId: savedProductOrder.seller._id,
        senderId: buyerId,
        type: "PRODUCT_ORDER_DELIVERED_SELLER",
        title: "Order Delivered!",
        message: `Order (#${orderDisplayId}) for ${orderSummaryText} was marked as delivered by the buyer.`,
        link: `/user/product-orders/${savedProductOrder._id}`, // Seller can view the same link
        relatedResource: savedProductOrder._id,
        relatedResourceType: "ProductOrder",
        io,
      }).catch((err) =>
        console.error(
          "Error sending order delivered notification to seller:",
          err
        )
      );
    }

    const fullyPopulatedOrder = await ProductOrder.findById(
      savedProductOrder._id
    )
      .populate({
        path: "items.product",
        select: "name images price sku category brand",
      })
      .populate("buyer", "name email profilePicture")
      .populate("seller", "name email profilePicture companyName");

    res.status(200).json({
      message: "Product order marked as delivered.",
      order: fullyPopulatedOrder,
    });
  } catch (error) {
    console.error(
      "[buyerMarkOrderDelivered] Error:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error marking order as delivered." });
  }
};

module.exports = {
  createProductOrder,
  confirmProductOrderPayment,
  getProductOrders,
  getProductOrderById,
  sellerConfirmProductOrder,
  sellerDeclineProductOrder,
  shipProductOrder,
  buyerMarkOrderDelivered,
};
