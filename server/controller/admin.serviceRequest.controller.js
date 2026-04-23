const ServiceRequest = require("../model/serviceRequest.model");
const User = require("../model/user.model");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const ServiceRequestOrder = require("../model/ServiceRequestOrderSchema");
const { createRefund } = require("../utils/stripeService");

// Admin: Get all service requests with pagination and filtering
const adminGetAllServiceRequests = async (req, res) => {
  try {
    // Ensure only admins can access this
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required." });
    }

    const {
      status,
      category,
      subcategory,
      budgetMin,
      budgetMax,
      location,
      locationPreference,
      page = 1,
      limit = 10,
      q, // Text search query
      sortBy = "createdAt",
      sortOrder = "desc", // 'asc' or 'desc'
    } = req.query;

    const currentPage = parseInt(page, 10) || 1;
    const itemsPerPage = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * itemsPerPage;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (locationPreference) filter.locationPreference = locationPreference;

    if (budgetMin !== undefined && !isNaN(Number(budgetMin))) {
      filter["budget.min"] = { $gte: Number(budgetMin) };
    }
    if (budgetMax !== undefined && !isNaN(Number(budgetMax))) {
      filter["budget.max"] = { $lte: Number(budgetMax) };
    }

    if (location) {
      const locationRegex = new RegExp(location.trim(), "i");
      filter.$or = [
        { locationPreference: "remote" },
        { locationPreference: "flexible" },
        { "onSiteAddresses.city": locationRegex },
        { "onSiteAddresses.country": locationRegex },
        { "onSiteAddresses.state": locationRegex },
        { "onSiteAddresses.street": locationRegex },
      ];
    }

    if (q && String(q).trim() !== "") {
      filter.$text = { $search: String(q).trim() };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const requestsQuery = ServiceRequest.find(filter)
      .populate("createdBy", "name email companyName") // Populate creator details
      .sort(sortOptions)
      .skip(skip)
      .limit(itemsPerPage);

    const totalQuery = ServiceRequest.countDocuments(filter);

    const [requests, total] = await Promise.all([
      requestsQuery.lean(),
      totalQuery,
    ]);

    res.status(200).json({
      serviceRequests: requests,
      pagination: {
        currentPage: currentPage,
        totalPages: Math.ceil(total / itemsPerPage) || 1,
        totalItems: total,
        limit: itemsPerPage,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching all service requests (Admin):",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({
        message: "Internal Server Error while fetching service requests.",
      });
  }
};

// Admin: Get a single service request by ID
const adminGetServiceRequestById = async (req, res) => {
  try {
    // Ensure only admins can access this
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required." });
    }

    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate(
        "createdBy",
        "name profilePicture accountType companyName representativeName isVerified email"
      )
      .populate({
        path: "offersReceived.seller",
        select:
          "name profilePicture accountType companyName representativeName isVerified rating averageRating reviewCount email",
      })
      .populate({
        path: "offersReceived.linkedServiceId",
        select: "title price priceType category slug",
      })
      .populate({
        path: "awardedSellerId",
        select: "name email companyName profilePicture",
      })
      .populate({
        path: "orderId", // Populate the associated ServiceRequestOrder
        select: "totalPrice status paymentIntentId paymentIntentClientSecret",
      });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    res.status(200).json(serviceRequest);
  } catch (error) {
    console.error(
      "Error fetching service request by ID (Admin):",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// Admin: Update a service request
const adminUpdateServiceRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required." });
    }

    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    const updates = req.body;
    const allowedUpdates = [
      "title",
      "description",
      "category",
      "subcategory",
      "budget",
      "desiredDeliveryTime",
      "locationPreference",
      "onSiteAddresses",
      "attachments",
      "tags",
      "status",
      "invitedProviders",
      "requiredSkills",
      "experienceLevel",
      "scopeOfWork",
      "requestType",
      "promotionDetails",
      "paymentStatus",
      "refundStatus",
      "cancellationReason",
      "refundNotes",
      "awardedOfferId",
      "awardedSellerId",
      "amountToBePaid",
      "scheduledDate",
      "scheduledTimeSlot",
      "scheduledSpecificTime",
      "schedulingNotes",
      "schedulingConfirmedByBuyer",
      "schedulingConfirmedBySeller",
      "rescheduleCount",
      "lastScheduleUpdateBy",
      "paymentIntentId",
      "paymentIntentClientSecret",
      "orderId",
      "currentScheduleProposal",
      "confirmedSchedule",
      "refundRequestedBy",
      "refundAmount",
    ];

    // Handle specific nested updates like budget and scopeOfWork
    if (updates.budget) {
      if (updates.budget.min !== undefined)
        serviceRequest.budget.min = updates.budget.min;
      if (updates.budget.max !== undefined)
        serviceRequest.budget.max = updates.budget.max;
      if (updates.budget.type !== undefined)
        serviceRequest.budget.type = updates.budget.type;
      if (updates.budget.currency !== undefined)
        serviceRequest.budget.currency = updates.budget.currency;
      delete updates.budget; // Remove from main updates to avoid overwriting the object
    }
    if (updates.scopeOfWork) {
      if (updates.scopeOfWork.unit !== undefined)
        serviceRequest.scopeOfWork.unit = updates.scopeOfWork.unit;
      if (updates.scopeOfWork.quantity !== undefined)
        serviceRequest.scopeOfWork.quantity = updates.scopeOfWork.quantity;
      if (updates.scopeOfWork.details !== undefined)
        serviceRequest.scopeOfWork.details = updates.scopeOfWork.details;
      delete updates.scopeOfWork;
    }
    if (updates.promotionDetails) {
      if (updates.promotionDetails.isPromoted !== undefined)
        serviceRequest.promotionDetails.isPromoted =
          updates.promotionDetails.isPromoted;
      if (updates.promotionDetails.promotedUntil !== undefined)
        serviceRequest.promotionDetails.promotedUntil =
          updates.promotionDetails.promotedUntil;
      if (updates.promotionDetails.feeAmount !== undefined)
        serviceRequest.promotionDetails.feeAmount =
          updates.promotionDetails.feeAmount;
      if (updates.promotionDetails.feeCurrency !== undefined)
        serviceRequest.promotionDetails.feeCurrency =
          updates.promotionDetails.feeCurrency;
      if (updates.promotionDetails.promotionOrderId !== undefined)
        serviceRequest.promotionDetails.promotionOrderId =
          updates.promotionDetails.promotionOrderId;
      if (updates.promotionDetails.paymentId !== undefined)
        serviceRequest.promotionDetails.paymentId =
          updates.promotionDetails.paymentId;
      delete updates.promotionDetails;
    }
    if (updates.onSiteAddresses) {
      try {
        const parsedOnSiteAddresses =
          typeof updates.onSiteAddresses === "string"
            ? JSON.parse(updates.onSiteAddresses)
            : updates.onSiteAddresses;
        if (Array.isArray(parsedOnSiteAddresses)) {
          serviceRequest.onSiteAddresses = parsedOnSiteAddresses.filter(
            (addr) => addr.city && addr.country
          );
        } else {
          serviceRequest.onSiteAddresses = [];
        }
      } catch (e) {
        console.error("Error parsing onSiteAddresses for admin update:", e);
        serviceRequest.onSiteAddresses = [];
      }
      delete updates.onSiteAddresses;
    }
    if (updates.tags) {
      try {
        const parsedTags =
          typeof updates.tags === "string"
            ? JSON.parse(updates.tags)
            : updates.tags;
        serviceRequest.tags = Array.isArray(parsedTags) ? parsedTags : [];
      } catch (e) {
        console.error("Error parsing tags for admin update:", e);
      }
      delete updates.tags;
    }
    if (updates.requiredSkills) {
      try {
        const parsedSkills =
          typeof updates.requiredSkills === "string"
            ? JSON.parse(updates.requiredSkills)
            : updates.requiredSkills;
        serviceRequest.requiredSkills = Array.isArray(parsedSkills)
          ? parsedSkills
          : [];
      } catch (e) {
        console.error("Error parsing requiredSkills for admin update:", e);
      }
      delete updates.requiredSkills;
    }
    if (updates.invitedProviders) {
      try {
        const parsedInvitedProviders =
          typeof updates.invitedProviders === "string"
            ? JSON.parse(updates.invitedProviders)
            : updates.invitedProviders;
        serviceRequest.invitedProviders = Array.isArray(parsedInvitedProviders)
          ? parsedInvitedProviders.filter((id) =>
              mongoose.Types.ObjectId.isValid(id)
            )
          : [];
      } catch (e) {
        console.error("Error parsing invitedProviders for admin update:", e);
      }
      delete updates.invitedProviders;
    }
    if (updates.currentScheduleProposal) {
      serviceRequest.currentScheduleProposal = updates.currentScheduleProposal;
      delete updates.currentScheduleProposal;
    }
    if (updates.confirmedSchedule) {
      serviceRequest.confirmedSchedule = updates.confirmedSchedule;
      delete updates.confirmedSchedule;
    }

    // Apply other direct updates
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        serviceRequest[key] = updates[key];
      }
    });

    // Handle attachment updates (similar to existing updateServiceRequest, but simplified for admin)
    const uploadsBaseDir = path.join(__dirname, "..", "uploads");
    let currentAttachments = serviceRequest.attachments || [];

    if (req.files && req.files.length > 0) {
      const newAttachmentPaths = req.files.map((file) => {
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/");
      });
      currentAttachments = [...currentAttachments, ...newAttachmentPaths];
    }

    // If admin sends `attachments` array, it overwrites existing ones (assuming full list is sent)
    if (updates.attachments && Array.isArray(updates.attachments)) {
      // Identify attachments to remove that are no longer in the new list
      const attachmentsToRemove = currentAttachments.filter(
        (path) => !updates.attachments.includes(path)
      );
      for (const filePath of attachmentsToRemove) {
        const fullPath = path.join(uploadsBaseDir, filePath);
        try {
          await fs.unlink(fullPath);
          console.log(`Admin deleted file: ${fullPath}`);
        } catch (err) {
          console.error(`Admin failed to delete file ${fullPath}:`, err);
        }
      }
      serviceRequest.attachments = updates.attachments; // Set to the new array provided by admin
    } else if (req.files && req.files.length > 0) {
      // If only new files are uploaded, append them
      serviceRequest.attachments = currentAttachments;
    }

    await serviceRequest.save();
    res
      .status(200)
      .json({
        message: "Service request updated successfully by admin.",
        serviceRequest,
      });
  } catch (error) {
    console.error(
      "Error updating service request (Admin):",
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error updating service request." });
  }
};

// Admin: Delete a single service request (hard delete)
const adminDeleteServiceRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required." });
    }

    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found." });
    }

    // Delete associated attachments from storage
    const uploadsBaseDir = path.join(__dirname, "..", "uploads");
    if (serviceRequest.attachments && serviceRequest.attachments.length > 0) {
      for (const attachmentPath of serviceRequest.attachments) {
        const fullPath = path.join(uploadsBaseDir, attachmentPath);
        try {
          await fs.unlink(fullPath);
          console.log(`Admin deleted attachment: ${fullPath}`);
        } catch (err) {
          console.warn(
            `Admin failed to delete attachment ${fullPath}:`,
            err.message
          );
        }
      }
    }

    // Delete associated ServiceRequestOrder if it exists
    if (serviceRequest.orderId) {
      await ServiceRequestOrder.findByIdAndDelete(serviceRequest.orderId);
      console.log(
        `Admin deleted associated ServiceRequestOrder: ${serviceRequest.orderId}`
      );
    }

    await ServiceRequest.findByIdAndDelete(requestId);
    res
      .status(200)
      .json({ message: "Service request deleted successfully by admin." });
  } catch (error) {
    console.error(
      "Error deleting service request (Admin):",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error deleting service request." });
  }
};

// Admin: Delete all service requests (DANGEROUS - use with extreme caution)
const adminDeleteAllServiceRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required." });
    }

    // Optional: Add a confirmation mechanism (e.g., a specific query parameter or body field)
    // if (req.body.confirm !== true) {
    //   return res.status(400).json({ message: "Confirmation required to delete all service requests." });
    // }

    // Find all service requests to delete their attachments
    const allServiceRequests = await ServiceRequest.find({});
    const uploadsBaseDir = path.join(__dirname, "..", "uploads");
    let attachmentsDeletedCount = 0;
    let ordersDeletedCount = 0;

    for (const sr of allServiceRequests) {
      if (sr.attachments && sr.attachments.length > 0) {
        for (const attachmentPath of sr.attachments) {
          const fullPath = path.join(uploadsBaseDir, attachmentPath);
          try {
            await fs.unlink(fullPath);
            attachmentsDeletedCount++;
          } catch (err) {
            console.warn(
              `Admin failed to delete attachment ${fullPath} during bulk delete:`,
              err.message
            );
          }
        }
      }
      if (sr.orderId) {
        await ServiceRequestOrder.findByIdAndDelete(sr.orderId);
        ordersDeletedCount++;
      }
    }

    const result = await ServiceRequest.deleteMany({});
    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} service requests, ${attachmentsDeletedCount} attachments, and ${ordersDeletedCount} associated orders.`,
    });
  } catch (error) {
    console.error(
      "Error deleting all service requests (Admin):",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({
        message: "Internal Server Error deleting all service requests.",
      });
  }
};

module.exports = {
  adminGetAllServiceRequests,
  adminGetServiceRequestById,
  adminUpdateServiceRequest,
  adminDeleteServiceRequest,
  adminDeleteAllServiceRequests,
};
