// controller/user.controller.js

const User = require("../model/user.model");
const Service = require("../model/service.model");
const Product = require("../model/product.model");
const Order = require("../model/order.model");
const ServiceRequest = require("../model/serviceRequest.model");
const Conversation = require("../model/conversation.model");
const Message = require("../model/message.model");
const Notification = require("../model/notification.model");
const Review = require("../model/review.model");
const ProductOrder = require("../model/productOrder.model");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs"); // For file system operations, e.g., deleting profile pictures/documents
const moment = require("moment"); // For date calculations

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Allow admin to delete any user, or user to delete their own account
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this account!" });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Delete associated Services (if user is a seller)
    if (userToDelete.isSeller) {
      const services = await Service.find({ createdBy: userId });
      for (const service of services) {
        // Optionally delete service-related files if any (e.g., images)
        // Example: if (service.image) { fs.unlinkSync(path.join(__dirname, '..', '..', 'public', service.image)); }
      }
      await Service.deleteMany({ createdBy: userId });
    }

    // 2. Delete associated Products (if user is a seller)
    if (userToDelete.isSeller) {
      const products = await Product.find({ createdBy: userId });
      for (const product of products) {
        // Optionally delete product-related files if any (e.g., images)
      }
      await Product.deleteMany({ createdBy: userId });
    }

    // 3. Delete associated Orders (where user is buyer or seller)
    await Order.deleteMany({
      $or: [{ buyer: userId }, { seller: userId }],
    });

    // 4. Delete associated ServiceRequests (where user is requester or provider)
    await ServiceRequest.deleteMany({
      $or: [{ requester: userId }, { provider: userId }],
    });

    // 5. Delete associated Conversations (where user is participant)
    await Conversation.deleteMany({ participants: userId });

    // 6. Delete associated Messages (sent by user)
    await Message.deleteMany({ sender: userId });

    // 7. Delete associated Notifications (sent to or by user)
    await Notification.deleteMany({
      $or: [{ recipient: userId }, { sender: userId }],
    });

    // 8. Delete associated Reviews (written by or about user)
    await Review.deleteMany({
      $or: [{ reviewer: userId }, { reviewedUser: userId }],
    });

    // 9. Delete associated ProductOrders (where user is buyer or seller)
    await ProductOrder.deleteMany({
      $or: [{ buyer: userId }, { seller: userId }],
    });

    // 10. Delete user's profile picture and documents from filesystem
    if (userToDelete.profilePicture) {
      const profilePicPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        userToDelete.profilePicture
      );
      try {
        if (fs.existsSync(profilePicPath)) {
          fs.unlinkSync(profilePicPath);
          console.log(`Deleted profile picture: ${profilePicPath}`);
        }
      } catch (e) {
        console.error(`Failed to delete profile picture ${profilePicPath}:`, e);
      }
    }
    if (userToDelete.documents && userToDelete.documents.length > 0) {
      for (const doc of userToDelete.documents) {
        const docPath = path.join(__dirname, "..", "..", "public", doc.url);
        try {
          if (fs.existsSync(docPath)) {
            fs.unlinkSync(docPath);
            console.log(`Deleted document: ${docPath}`);
          }
        } catch (e) {
          console.error(`Failed to delete document ${docPath}:`, e);
        }
      }
    }

    // 11. Finally, delete the user
    await User.findByIdAndDelete(userId);

    // If admin deleted another user
    if (req.user.isAdmin && req.user._id.toString() !== userId) {
      res.status(200).json({
        message: `User ${userId} and associated data deleted successfully.`,
      });
    } else {
      // If user deleted their own account (or admin deleted their own)
      res
        .status(200)
        .json({ message: "Account and associated data deleted successfully." });
      // Optionally: Clear cookies/session if self-deletion
    }
  } catch (error) {
    console.error("Error deleting user and associated data:", error);
    res.status(500).json({
      message: "Error deleting account and associated data",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id; // Assuming ID comes from route param :id

    // --- Authorization Check ---
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this profile!" });
    }

    // --- Admin Restrictions ---
    // Prevent admins from changing sensitive fields like email and password
    if (req.user.isAdmin && req.user._id.toString() !== userId) {
      const restrictedFields = ["email", "password"];
      const attemptedRestrictedUpdates = [];
      
      restrictedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          attemptedRestrictedUpdates.push(field);
        }
      });
      
      if (attemptedRestrictedUpdates.length > 0) {
        return res.status(403).json({ 
          message: `Admins are not allowed to change the following fields: ${attemptedRestrictedUpdates.join(", ")}` 
        });
      }
    }

    // --- Find User ---
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Prepare Updates ---
    const updatesToSet = {}; // Fields for $set
    const updateOperations = {}; // Combined $set and $push operations

    // Define Updatable Fields
    const userUpdatableFields = [
      "name",
      "telephone",
      "location",
      "bio",
      "profilePicture",
      "address",
      "companyName",
      "representativeName",
      "website",
      "experience",
      "skills",
      "generalAreaOfService",
      "stripeAccountId",
    ]; // Removed "stripeAccountId" and "email" from generic updatable fields - email cannot be changed by admin
    const adminOnlyUpdatableFields = [
      "isVerified",
      "isSeller",
      "isAdmin",
      "accountType",
      "isEmailVerified",
    ];

    // --- Process Regular Text/Object Fields ---
    userUpdatableFields.forEach((key) => {
      // Exclude file fields and handle undefined
      if (
        req.body[key] !== undefined &&
        key !== "profilePicture" &&
        key !== "documents"
      ) {
        updatesToSet[key] = req.body[key];
      }
    });

    // // --- Special Handling for stripeAccountId ---
    // // Only allow stripeAccountId to be set if it's not already present on the user
    // // This prevents accidental overwrites or attempts to change an existing, unique ID.
    // if (req.body.stripeAccountId !== undefined) {
    //   if (!user.stripeAccountId) {
    //     updatesToSet.stripeAccountId = req.body.stripeAccountId;
    //   } else if (user.stripeAccountId !== req.body.stripeAccountId) {
    //     console.warn(
    //       `[updateUser] Attempted to change existing stripeAccountId for user ${userId}. Ignoring update for this field.`
    //     );
    //     // Optionally, you could return an error here if changing it is strictly forbidden
    //     // return res.status(400).json({ message: "Stripe Account ID cannot be changed once set." });
    //   }
    // }

    // Process Admin-Only Fields (if user is admin)
    if (req.user.isAdmin) {
      adminOnlyUpdatableFields.forEach((key) => {
        if (req.body[key] !== undefined) {
          // Handle boolean strings
          if (typeof req.body[key] === "string") {
            if (req.body[key].toLowerCase() === "true")
              updatesToSet[key] = true;
            else if (req.body[key].toLowerCase() === "false")
              updatesToSet[key] = false;
            else updatesToSet[key] = req.body[key]; // Keep other strings (like accountType)
          } else {
            updatesToSet[key] = req.body[key]; // Assume correct type otherwise
          }
        }
      });
    }

    // Process Address Separately
    if (req.body.address !== undefined) {
      if (req.body.address === null) {
        // Allow clearing the address by setting to null or empty object
        updatesToSet.address = {}; // Or set individual fields to null/undefined
      } else if (typeof req.body.address === "object") {
        const existingAddress = user.address || {};
        // Merge provided fields with existing ones
        updatesToSet.address = {
          street: req.body.address.street ?? existingAddress.street ?? "", // Default to empty string
          city: req.body.address.city ?? existingAddress.city ?? "",
          state: req.body.address.state ?? existingAddress.state ?? "",
          zip: req.body.address.zip ?? existingAddress.zip ?? "",
          country: req.body.address.country ?? existingAddress.country ?? "",
        };
      }
    }

    // --- Handle File Uploads ---

    // 1. Profile Picture
    if (req.files?.profilePicture?.length > 0) {
      const file = req.files.profilePicture[0];
      // **Important**: Adjust path relative to your static file serving root in 'public'
      const relativePath = path.join(
        "uploads",
        "profile_pictures",
        file.filename
      );
      updatesToSet.profilePicture = relativePath.replace(/\\/g, "/");
      console.log(
        "Updating profile picture path:",
        updatesToSet.profilePicture
      );
      // Optional: Delete old profile picture file if it exists and is different
      // if (user.profilePicture && user.profilePicture !== updatesToSet.profilePicture) {
      //     try { fs.unlinkSync(path.join(__dirname, '..', '..', 'public', user.profilePicture)); } catch(e){ console.error("Failed to delete old profile pic", e); }
      // }
    }

    // 2. Documents (Append new ones)
    let uploadedDocuments = [];
    if (req.files?.documents?.length > 0) {
      const numFiles = req.files.documents.length;
      const receivedTypes = req.body.documentTypes; // This could be a string or an array

      console.log("[updateUser] Received Files Count:", numFiles);
      console.log("[updateUser] Received Types Raw:", receivedTypes);

      let typesArray = []; // Initialize empty array for types

      // --- Logic to ensure typesArray matches files ---
      if (numFiles === 1) {
        // Handle single file upload
        let singleType = "";
        if (typeof receivedTypes === "string" && receivedTypes.trim()) {
          singleType = receivedTypes.trim();
        } else if (
          Array.isArray(receivedTypes) &&
          receivedTypes.length === 1 &&
          typeof receivedTypes[0] === "string" &&
          receivedTypes[0].trim()
        ) {
          singleType = receivedTypes[0].trim(); // Handle single-element array case
        }

        if (!singleType) {
          // Error: Type is required for the single file
          req.files.documents.forEach((file) => {
            try {
              fs.unlinkSync(file.path);
            } catch (e) {}
          });
          console.error("[updateUser] Type error for single file:", {
            receivedTypes,
          });
          return res.status(400).json({
            message: `A 'documentTypes' string is required for the uploaded file. Received: ${JSON.stringify(
              receivedTypes
            )}`,
          });
        }
        typesArray = [singleType]; // Create array with the single type
      } else {
        // numFiles > 1
        // Handle multiple file upload
        if (
          !receivedTypes ||
          !Array.isArray(receivedTypes) ||
          receivedTypes.length !== numFiles
        ) {
          // Error: Mismatch or missing types array
          req.files.documents.forEach((file) => {
            try {
              fs.unlinkSync(file.path);
            } catch (e) {}
          });
          console.error("[updateUser] Type array error for multiple files:", {
            numFiles,
            receivedTypes,
          });
          return res.status(400).json({
            message: `An array 'documentTypes' matching the number of uploaded files (${numFiles}) is required. Received: ${JSON.stringify(
              receivedTypes
            )}`,
          });
        }
        // Use the received array, cleaning up potentially empty strings
        typesArray = receivedTypes.map((type) =>
          typeof type === "string" && type.trim() ? type.trim() : "Unknown"
        );
        if (typesArray.includes("Unknown")) {
          console.warn(
            "[updateUser] Some document types in the received array were invalid/empty and defaulted to 'Unknown'."
          );
          // Optional: You could choose to throw an error here instead if all types must be valid
        }
      }
      // --- End type processing ---

      console.log("[updateUser] Processed Types Array:", typesArray);

      // Map files using the processed typesArray
      uploadedDocuments = req.files.documents.map((file, index) => {
        const docType = typesArray[index]; // Should always have a value (string or 'Unknown')

        // **Important**: Adjust path relative to your static file serving root
        const relativePath = path.join("uploads", "documents", file.filename);
        console.log(
          `[updateUser] Mapping file ${index}: ${file.originalname} with type: ${docType}`
        );
        return {
          type: docType,
          url: relativePath.replace(/\\/g, "/"),
          uploadedAt: new Date(),
        };
      });

      // Add $push operation only if documents were successfully processed
      if (uploadedDocuments.length > 0) {
        updateOperations.$push = { documents: { $each: uploadedDocuments } };
      }
    }
    // --- End Document Upload Handling ---

    // --- Finalize Update Payload ---
    // Add $set only if there are fields to set
    if (Object.keys(updatesToSet).length > 0) {
      updateOperations.$set = updatesToSet;
    }

    // Check if there's actually anything to update ($set or $push)
    if (Object.keys(updateOperations).length === 0) {
      return res.status(400).json({ message: "No update data provided." });
    }

    // --- Perform Database Update ---
    console.log(
      "[updateUser] Performing update with operations:",
      JSON.stringify(updateOperations)
    ); // Log the update object
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateOperations, // Use the combined operations object
      { new: true, runValidators: true, context: "query" } // Options
    ).select(
      "name email bio telephone location profilePicture address companyName representativeName website experience skills generalAreaOfService isVerified isSeller isAdmin hasSetIntent userIntent userCategories documents reviews isEmailVerified subscription"
    ); // Explicitly include all necessary fields

    // --- Handle Update Result ---
    if (!updatedUser) {
      // This might happen if the user was deleted concurrently
      return res.status(404).json({ message: "User not found during update." });
    }

    res
      .status(200)
      .json({ message: "Profile updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);

    // Cleanup any uploaded files on error
    const cleanupFiles = (filesObj) => {
      if (!filesObj) return;
      Object.values(filesObj).forEach((fileList) => {
        if (Array.isArray(fileList)) {
          fileList.forEach((f) => {
            try {
              fs.unlinkSync(f.path);
            } catch (e) {
              console.error(`Cleanup failed for ${f.path}: ${e.message}`);
            }
          });
        }
      });
    };
    cleanupFiles(req.files);

    // Specific Error Handling
    if (error.code === 11000) {
      // Duplicate key error (likely email)
      return res.status(409).json({
        message: "Update failed. Email might already exist.",
        error: error.message,
      });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      // Mongoose validation error
      return res
        .status(400)
        .json({ message: "Validation failed.", errors: error.errors });
    }
    // Generic server error
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Decide what data is public vs private
    // Let's assume anyone logged in can view basic profile, but only owner/admin see everything
    let userQuery = User.findById(userId).select(
      "name email bio telephone location profilePicture address companyName representativeName website experience skills generalAreaOfService isVerified isSeller isAdmin hasSetIntent userIntent userCategories documents reviews isEmailVerified subscription accountType stripeAccountId"
    ); // Explicitly include all necessary fields, including accountType and stripeAccountId

    // If the requesting user is not the profile owner and not an admin, maybe hide more?
    // Example: hide documents, maybe full address details
    // if (req.user._id.toString() !== userId && !req.user.isAdmin) {
    //    userQuery = userQuery.select("-documents -address.street -address.zip");
    // }

    const user = await userQuery;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch services and products only if the user is a seller
    let services = [];
    let products = [];
    if (user.isSeller) {
      services = await Service.find({ createdBy: userId });
      products = await Product.find({ createdBy: userId });
    }

    res.status(200).json({ user, services, products });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

const getUnverifiedSellers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isSeller: true, isVerified: false };

    const sellersQuery = User.find(filter)
      .select(
        "-password -emailVerificationToken -emailVerificationCode -emailVerificationExpires"
      ) // Exclude sensitive fields
      .sort({ createdAt: -1 }) // Sort by creation date by default
      .skip(skip)
      .limit(limit);

    const sellers = await sellersQuery;
    const total = await User.countDocuments(filter);

    res.status(200).json({
      data: sellers,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching unverified sellers:", error);
    res.status(500).json({
      message: "Error fetching unverified sellers",
      error: error.message,
    });
  }
};

const getVerifiedSellerUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isSeller: true, isVerified: true };

    const sellersQuery = User.find(filter)
      .select(
        "-password -emailVerificationToken -emailVerificationCode -emailVerificationExpires"
      ) // Exclude sensitive fields
      .sort({ createdAt: -1 }) // Sort by creation date by default
      .skip(skip)
      .limit(limit);

    const sellers = await sellersQuery;
    const total = await User.countDocuments(filter);

    res.status(200).json({
      data: sellers,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching verified seller users:", error);
    res.status(500).json({
      message: "Error fetching verified seller users",
      error: error.message,
    });
  }
};

/**
 * @desc    Admin verifies a user (can be a buyer or a seller)
 * @route   PATCH /api/users/:id/verify  (Using PATCH as it's a partial update)
 * @access  Private (Admin Only)
 */

const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Ensure only admins can verify users
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "You are not authorized to verify users." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This seller is already verified." });
    }

    user.isVerified = true;
    user.status = "active"; // Set status to active upon verification
    await user.save({ validateModifiedOnly: true });

    // TODO: Optionally send an email notification to the seller

    res.status(200).json({
      message: "Seller verified successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        status: user.status,
        isSeller: user.isSeller,
      },
    });
  } catch (error) {
    console.error("Error verifying seller:", error);
    res
      .status(500)
      .json({ message: "Error verifying seller", error: error.message });
  }
};

/**
 * @desc    Update user status (active, pending, suspended)
 * @route   PUT /api/users/:id/status
 * @access  Private (Admin Only)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "pending", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Ensure only admins can change status
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "You are not authorized to change user status." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      message: `User status updated to ${status} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Error updating user status", error: error.message });
  }
};

/**
 * @desc    Get all users with pagination, sorting, and filtering
 * @route   GET /api/users
 * @access  Private (Admin Only)
 */
const getAllUsers = async (req, res) => {
  try {
    // --- Pagination ---
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // --- Sorting ---
    const sortBy = req.query.sortBy || "createdAt"; // Default sort field
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // Default sort order (desc)
    const sort = { [sortBy]: sortOrder };

    // --- Filtering ---
    const filter = {};
    const allowedFilters = [
      "accountType",
      "isSeller",
      "isVerified",
      "isAdmin",
      "isEmailVerified",
      "name",
      "email",
    ]; // Add more fields as needed

    for (const key in req.query) {
      if (allowedFilters.includes(key)) {
        // Handle boolean filters specifically (coming as strings 'true'/'false')
        if (
          ["isSeller", "isVerified", "isAdmin", "isEmailVerified"].includes(key)
        ) {
          if (req.query[key] === "true") {
            filter[key] = true;
          } else if (req.query[key] === "false") {
            filter[key] = false;
          }
          // Ignore if the value is neither 'true' nor 'false'
        }
        // Handle text search for name/email (case-insensitive partial match)
        else if (["name", "email"].includes(key)) {
          filter[key] = { $regex: req.query[key], $options: "i" };
        }
        // Handle exact match for other allowed string fields (like accountType)
        else {
          filter[key] = req.query[key];
        }
      }
    }

    // --- Database Query ---
    const usersQuery = User.find(filter)
      .select(
        "-password -emailVerificationToken -emailVerificationCode -emailVerificationExpires"
      ) // Exclude sensitive fields
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Execute queries in parallel for efficiency
    const [users, totalUsers] = await Promise.all([
      usersQuery.exec(),
      User.countDocuments(filter), // Count documents matching the filter
    ]);

    // --- Response ---
    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalItems: totalUsers,
        itemsPerPage: limit,
      },
      appliedFilters: filter, // Optionally return the filters applied
      appliedSort: sort, // Optionally return the sort applied
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    // Provide more specific error feedback if possible (e.g., invalid sort field)
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        message: "Invalid query parameter value.",
        error: error.message,
      });
    }
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

/**
 * @desc    Remove a specific document for a given user
 * @route   DELETE /api/users/:userId/documents/:docId
 * @access  Private (Self or Admin)
 */
const removeDocument = async (req, res) => {
  try {
    // *** Get userId from route parameters ***
    const userId = req.params.userId;
    const documentIdToRemove = req.params.docId;

    // *** Authorization Check ***
    // Allow if the requesting user is the target user OR if the requesting user is an admin
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to modify this user's documents.",
      });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }
    if (!mongoose.Types.ObjectId.isValid(documentIdToRemove)) {
      return res.status(400).json({ message: "Invalid document ID format." });
    }

    // Find the user (no need to select documents only here, findById works)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the specific document within the user's documents array
    const docToRemove = user.documents.id(documentIdToRemove);

    if (!docToRemove) {
      return res
        .status(404)
        .json({ message: "Document not found for this user." });
    }

    // --- Delete File from Filesystem ---
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      docToRemove.url
    ); // Adjust based on your static root
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      } else {
        console.warn(
          `File not found for deletion, but removing DB record: ${filePath}`
        );
      }
    } catch (fileError) {
      console.error(`Error deleting document file ${filePath}:`, fileError);
      // Decide how to proceed (stop or continue DB removal)
      // return res.status(500).json({ message: 'Error deleting document file.' });
    }

    // --- Remove Document from Database Array ---
    // Use findByIdAndUpdate with $pull for clarity and atomicity guarantee if needed later
    const updatedUserResult = await User.findByIdAndUpdate(
      userId,
      { $pull: { documents: { _id: documentIdToRemove } } },
      { new: true } // Return the updated user document
    ).select("documents"); // Select only documents to return

    // Check if the user was found and updated (updatedUserResult will be null if findByIdAndUpdate fails)
    if (!updatedUserResult) {
      // This might happen if the user was deleted between checks
      return res
        .status(404)
        .json({ message: "User not found during document removal update." });
    }

    res.status(200).json({
      message: "Document removed successfully.",
      documents: updatedUserResult.documents, // Return updated list
    });
  } catch (error) {
    console.error("Error removing document:", error);
    res
      .status(500)
      .json({ message: "Error removing document", error: error.message });
  }
};

/**
 * @desc    Admin creates a new user account
 * @route   POST /api/users/admin/create
 * @access  Private (Admin Only)
 */
const adminCreateUser = async (req, res) => {
  try {
    const {
      email,
      password,
      accountType,
      name, // For individual
      companyName, // For agency
      representativeName, // For agency
      isSeller,
      isVerified,
      isAdmin,
      experience,
      skills,
      generalAreaOfService,
      // Include any other fields from UserSchema you want the admin to set directly
      // e.g., bio, location, telephone, website, address etc.
      ...otherData // Capture remaining fields from req.body
    } = req.body;

    // --- Essential Validation ---
    if (!email || !password || !accountType) {
      return res.status(400).json({
        message: "Email, password, and accountType are required.",
      });
    }

    if (!["individual", "agency"].includes(accountType)) {
      return res.status(400).json({
        message: "Invalid accountType. Must be 'individual' or 'agency'.",
      });
    }

    // --- Check for Existing User ---
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    // --- Prepare User Data ---
    const newUserPayload = {
      email: email.toLowerCase(),
      password, // Hashing is handled by the pre-save hook
      accountType,
      name: accountType === "individual" ? name : undefined,
      companyName: accountType === "agency" ? companyName : undefined,
      representativeName:
        accountType === "agency" ? representativeName : undefined,
      // Allow admin to directly set these flags if provided
      isSeller: typeof isSeller === "boolean" ? isSeller : false, // Default if not provided
      isVerified: typeof isVerified === "boolean" ? isVerified : false,
      isAdmin: typeof isAdmin === "boolean" ? isAdmin : false,
      experience,
      skills,
      generalAreaOfService,
      createdBy: req.user._id,
      // isEmailVerified: true, // Uncomment if desired
      ...otherData, // Include other provided fields like bio, location etc.
    };

    // --- Create and Save New User ---
    const newUser = new User(newUserPayload);
    const savedUser = await newUser.save(); // Triggers pre-save hook for password

    // --- Respond ---
    // Exclude sensitive fields from the response
    const userResponse = savedUser.toObject(); // Convert Mongoose doc to plain object
    delete userResponse.password;
    delete userResponse.emailVerificationCode;
    delete userResponse.emailVerificationExpires;
    delete userResponse.emailVerificationToken;

    res.status(201).json({
      message: "User created successfully by admin.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Admin Create User Error:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Failed", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error creating user.", error: error.message });
  }
};

/**
 * @desc    Get a list of service providers (verified sellers) for invitation
 * @route   GET /api/users/service-providers
 * @access  Private (Authenticated Users)
 */
const getServiceProviders = async (req, res) => {
  try {
    const { searchTerm, limit = 50, page = 1 } = req.query; // Default limit for autocomplete

    const query = {
      isSeller: true,
      isVerified: true, // Only suggest verified providers for invitation
    };

    // Exclude the current user (requestor) only if authenticated
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i"); // Case-insensitive search
      query.$or = [
        { name: { $regex: regex } },
        { companyName: { $regex: regex } },
        // Optionally search by email if appropriate for your use case and privacy considerations
        { email: { $regex: regex } },
      ];
    }

    const selectFields = "_id name companyName profilePicture accountType"; // Fields needed for frontend display

    const providers = await User.find(query)
      .select(selectFields)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ name: 1, companyName: 1 }); // Sort for consistency

    const totalProviders = await User.countDocuments(query);

    res.status(200).json({
      message: "Service providers fetched successfully",
      data: providers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProviders / parseInt(limit)),
        totalItems: totalProviders,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching service providers:", error);
    res.status(500).json({
      message: "Error fetching service providers",
      error: error.message,
    });
  }
};

/**
 * @desc    Admin deletes multiple user accounts and their associated data
 * @route   DELETE /api/users/admin/multiple
 * @access  Private (Admin Only)
 */
const deleteMultipleUsers = async (req, res) => {
  try {
    const { userIds } = req.body; // Expect an array of user IDs

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No user IDs provided for deletion." });
    }

    // Ensure all provided IDs are valid Mongoose ObjectIDs
    const invalidIds = userIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: `Invalid user ID format(s): ${invalidIds.join(", ")}`,
      });
    }

    // Only allow admin to perform this action (already handled by middleware, but good to double check)
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to perform this action." });
    }

    let deletedUsersCount = 0;
    let deletedServicesCount = 0;
    let deletedProductsCount = 0;
    let deletedOrdersCount = 0;
    let deletedServiceRequestsCount = 0;
    let deletedConversationsCount = 0;
    let deletedMessagesCount = 0;
    let deletedNotificationsCount = 0;
    let deletedReviewsCount = 0;
    let deletedProductOrdersCount = 0;

    for (const userId of userIds) {
      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
        console.warn(`User with ID ${userId} not found, skipping.`);
        continue;
      }

      // 1. Delete associated Services (if user is a seller)
      if (userToDelete.isSeller) {
        const services = await Service.find({ createdBy: userId });
        for (const service of services) {
          // Optionally delete service-related files if any (e.g., images)
          // Example: if (service.image) { fs.unlinkSync(path.join(__dirname, '..', '..', 'public', service.image)); }
        }
        const { deletedCount } = await Service.deleteMany({
          createdBy: userId,
        });
        deletedServicesCount += deletedCount;
      }

      // 2. Delete associated Products (if user is a seller)
      if (userToDelete.isSeller) {
        const products = await Product.find({ createdBy: userId });
        for (const product of products) {
          // Optionally delete product-related files if any (e.g., images)
        }
        const { deletedCount } = await Product.deleteMany({
          createdBy: userId,
        });
        deletedProductsCount += deletedCount;
      }

      // 3. Delete associated Orders (where user is buyer or seller)
      const { deletedCount: ordersAsBuyer } = await Order.deleteMany({
        buyer: userId,
      });
      const { deletedCount: ordersAsSeller } = await Order.deleteMany({
        seller: userId,
      });
      deletedOrdersCount += ordersAsBuyer + ordersAsSeller;

      // 4. Delete associated ServiceRequests (where user is requester or provider)
      const { deletedCount: srAsRequester } = await ServiceRequest.deleteMany({
        requester: userId,
      });
      const { deletedCount: srAsProvider } = await ServiceRequest.deleteMany({
        provider: userId,
      });
      deletedServiceRequestsCount += srAsRequester + srAsProvider;

      // 5. Delete associated Conversations (where user is participant)
      const { deletedCount: convAsParticipant } = await Conversation.deleteMany(
        { participants: userId }
      );
      deletedConversationsCount += convAsParticipant;

      // 6. Delete associated Messages (sent by user)
      const { deletedCount: msgSentByUser } = await Message.deleteMany({
        sender: userId,
      });
      deletedMessagesCount += msgSentByUser;

      // 7. Delete associated Notifications (sent to or by user)
      const { deletedCount: notifToUser } = await Notification.deleteMany({
        recipient: userId,
      });
      const { deletedCount: notifFromUser } = await Notification.deleteMany({
        sender: userId,
      });
      deletedNotificationsCount += notifToUser + notifFromUser;

      // 8. Delete associated Reviews (written by or about user)
      const { deletedCount: reviewsBy } = await Review.deleteMany({
        reviewer: userId,
      });
      const { deletedCount: reviewsAbout } = await Review.deleteMany({
        reviewedUser: userId,
      });
      deletedReviewsCount += reviewsBy + reviewsAbout;

      // 9. Delete associated ProductOrders (where user is buyer or seller)
      const { deletedCount: poAsBuyer } = await ProductOrder.deleteMany({
        buyer: userId,
      });
      const { deletedCount: poAsSeller } = await ProductOrder.deleteMany({
        seller: userId,
      });
      deletedProductOrdersCount += poAsBuyer + poAsSeller;

      // 10. Delete user's profile picture and documents from filesystem
      if (userToDelete.profilePicture) {
        const profilePicPath = path.join(
          __dirname,
          "..",
          "..",
          "public",
          userToDelete.profilePicture
        );
        try {
          if (fs.existsSync(profilePicPath)) {
            fs.unlinkSync(profilePicPath);
            console.log(`Deleted profile picture: ${profilePicPath}`);
          }
        } catch (e) {
          console.error(
            `Failed to delete profile picture ${profilePicPath}:`,
            e
          );
        }
      }
      if (userToDelete.documents && userToDelete.documents.length > 0) {
        for (const doc of userToDelete.documents) {
          const docPath = path.join(__dirname, "..", "..", "public", doc.url);
          try {
            if (fs.existsSync(docPath)) {
              fs.unlinkSync(docPath);
              console.log(`Deleted document: ${docPath}`);
            }
          } catch (e) {
            console.error(`Failed to delete document ${docPath}:`, e);
          }
        }
      }

      // 11. Finally, delete the user
      await User.findByIdAndDelete(userId);
      deletedUsersCount++;
    }

    res.status(200).json({
      message: `Successfully deleted ${deletedUsersCount} user(s) and their associated data.`,
      details: {
        users: deletedUsersCount,
        services: deletedServicesCount,
        products: deletedProductsCount,
        orders: deletedOrdersCount,
        serviceRequests: deletedServiceRequestsCount,
        conversations: deletedConversationsCount,
        messages: deletedMessagesCount,
        notifications: deletedNotificationsCount,
        reviews: deletedReviewsCount,
        productOrders: deletedProductOrdersCount,
      },
    });
  } catch (error) {
    console.error("Error deleting multiple users:", error);
    res
      .status(500)
      .json({ message: "Error deleting multiple users", error: error.message });
  }
};

const updateUserIntent = async (req, res) => {
  try {
    const userId = req.params.id;
    const { userIntent, userCategories, isSeller } = req.body;

    // Authorization Check: User can only update their own intent
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        message: "You are not authorized to update this user's intent.",
      });
    }

    // Basic validation
    if (!userIntent || !["provide", "buy"].includes(userIntent)) {
      return res.status(400).json({
        message: "Invalid or missing user intent. Must be 'provide' or 'buy'.",
      });
    }
    if (
      !Array.isArray(userCategories) ||
      userCategories.length === 0 ||
      !userCategories.every((cat) =>
        ["services", "products", "talent"].includes(cat)
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid or missing user categories. Must be an array containing 'services', 'products', or 'talent'.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update fields
    user.userIntent = userIntent;
    user.userCategories = userCategories;
    user.isSeller = isSeller;
    user.hasSetIntent = true; // Mark that the user has set their intent

    const updatedUser = await user.save({ validateModifiedOnly: true }); // Save only modified fields

    // Prepare user object to send back (exclude sensitive fields)
    const userToSend = updatedUser.toObject();
    delete userToSend.password;
    delete userToSend.emailVerificationToken;
    delete userToSend.emailVerificationCode;
    delete userToSend.emailVerificationExpires;

    res.status(200).json({
      message: "User intent updated successfully.",
      user: userToSend,
    });
  } catch (error) {
    console.error("Error updating user intent:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation failed.", errors: error.errors });
    }
    res.status(500).json({
      message: "Internal server error during intent update.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get user analytics data for admin dashboard
 * @route   GET /api/users/analytics
 * @access  Private (Admin Only)
 */
const getUserAnalytics = async (req, res) => {
  try {
    // Total number of users
    const totalUsers = await User.countDocuments({});

    // New users in the last 7 days
    const sevenDaysAgo = moment().subtract(7, "days").toDate();
    const newUsersLast7Days = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Number of verified sellers
    const verifiedSellers = await User.countDocuments({
      isSeller: true,
      isVerified: true,
    });

    // Number of unverified sellers
    const unverifiedSellers = await User.countDocuments({
      isSeller: true,
      isVerified: false,
    });

    // Number of active users (e.g., logged in within the last 30 days)
    // NOTE: This requires a 'lastLogin' field in your User model, which is not present.
    // For demonstration, I'll just return 0 or you can implement a mechanism to track last login.
    // For now, I'll omit active users and focus on available data.
    // const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    // const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

    res.status(200).json({
      message: "User analytics fetched successfully",
      data: {
        totalUsers,
        newUsersLast7Days,
        verifiedSellers,
        unverifiedSellers,
        // activeUsers, // Uncomment if you add lastLogin to User model
      },
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({
      message: "Error fetching user analytics",
      error: error.message,
    });
  }
};

/**
 * @desc    Check if the authenticated user has any products, product requests, services, or service requests
 * @route   GET /api/users/has-content
 * @access  Private (Authenticated User)
 */
const checkUserContent = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming req.user is populated by authentication middleware

    // Check for Services created by the user
    const hasServices = await Service.exists({ createdBy: userId });
    if (hasServices) {
      return res.status(200).json({ hasContent: true });
    }

    // Check for Products created by the user
    const hasProducts = await Product.exists({ createdBy: userId });
    if (hasProducts) {
      return res.status(200).json({ hasContent: true });
    }

    // Check for Service Requests created by the user (as requester)
    const hasServiceRequests = await ServiceRequest.exists({
      requester: userId,
    });
    if (hasServiceRequests) {
      return res.status(200).json({ hasContent: true });
    }

    // Check for Requested Products created by the user (as requester)
    // Assuming 'RequestedProduct' model exists and has a 'requester' field
    const RequestedProduct = require("../model/requestedProduct.model"); // Ensure this is imported at the top
    const hasRequestedProducts = await RequestedProduct.exists({
      requester: userId,
    });
    if (hasRequestedProducts) {
      return res.status(200).json({ hasContent: true });
    }

    // If none of the above exist
    res.status(200).json({ hasContent: false });
  } catch (error) {
    console.error("Error checking user content:", error);
    res.status(500).json({
      message: "Error checking user content",
      error: error.message,
    });
  }
};

// --- Export all controller functions ---
module.exports = {
  deleteUser,
  updateUser,
  getProfile,
  getUnverifiedSellers,
  verifyUser,
  getAllUsers,
  removeDocument,
  adminCreateUser,
  getServiceProviders,
  deleteMultipleUsers,
  getVerifiedSellerUsers,
  updateUserIntent,
  getUserAnalytics,
  updateUserStatus, // Add the new function
  checkUserContent, // Add the new function
};
