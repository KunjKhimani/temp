const ServiceRequest = require("../model/serviceRequest.model");
const RequestedProduct = require("../model/requestedProduct.model");
const Product = require("../model/product.model");
const Service = require("../model/service.model");
const User = require("../model/user.model");
const mongoose = require("mongoose");
const { activateCommunityOfferLogic } = require("../utils/communityHelper");

// @desc    Get all community offers (Service Requests and Requested Products)
// @route   GET /api/community-offers
// @access  Public
const getCommunityOffers = async (req, res) => {
  try {
    const {
      itemType, page = 1, limit = 12, status = "active", tab,
      q, category, subcategory, location, providerName, type, locationPreference,
      startDate, startTime
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitInt = parseInt(limit, 10);
    const selectedType = type || itemType;

    const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    // 1. Build User-based filter (providerName)
    let userIds = [];
    if (providerName) {
      const users = await User.find({
        $or: [
          { name: { $regex: new RegExp(escapeRegex(providerName).trim(), "i") } },
          { companyName: { $regex: new RegExp(escapeRegex(providerName).trim(), "i") } },
          { representativeName: { $regex: new RegExp(escapeRegex(providerName).trim(), "i") } }
        ]
      }).select("_id");
      userIds = users.map(u => u._id);
    }

    // 2. Helper to build query for each collection
    const buildCollectionQuery = (colType) => {
      const query = { isCommunity: true };

      // Category / Subcategory
      if (category) {
        query.category = { $regex: new RegExp(escapeRegex(category).trim(), "i") };
      }
      if (subcategory) {
        query.subcategory = { $regex: new RegExp(escapeRegex(subcategory).trim(), "i") };
      }

      // Provider Name logic
      if (providerName) {
        if (colType === "RequestedProduct") {
          query.requestedBy = { $in: userIds };
        } else {
          query.createdBy = { $in: userIds };
        }
      }

      // Status logic (map common status to collection-specific status)
      if (status || tab) {
        const targetStatus = status || tab;
        if (targetStatus === "active") {
          if (colType === "ServiceRequest") query.status = "open";
          else if (colType === "RequestedProduct") query.status = "pending";
          else query.status = "active";
        } else {
          query.status = targetStatus;
        }
      }

      // Search 'q'
      if (q) {
        const qRegex = { $regex: new RegExp(escapeRegex(q).trim(), "i") };
        if (colType === "Service" || colType === "ServiceRequest") {
          query.$or = [{ title: qRegex }, { description: qRegex }];
        } else {
          query.$or = [{ name: qRegex }, { description: qRegex }];
        }
      }

      // Location Filter
      if (location) {
        const locRegex = { $regex: new RegExp(escapeRegex(location).trim(), "i") };
        if (colType === "Service") {
          query.locations = locRegex;
        } else if (colType === "ServiceRequest") {
          query["onSiteAddresses.city"] = locRegex;
        } else if (colType === "RequestedProduct") {
          query.deliveryLocation = locRegex;
        }
        // Product doesn't have a direct location field in schema currently
      }

      // Location Preference
      if (locationPreference) {
        if (colType === "Service") {
          // For Service, 'type' field is used for site preference
          query.type = locationPreference;
        } else if (colType === "ServiceRequest") {
          query.locationPreference = locationPreference;
        }
      }

      // Time Filtering (startDate/startTime)
      if (startDate) {
        const dateObj = new Date(startDate);
        if (!isNaN(dateObj.getTime())) {
          query.createdAt = { $gte: dateObj };
        }
      }

      if (startDate || startTime) {
        if (colType === "Service") {
          const serviceTimeQuery = [];
          
          if (startDate) {
            const dateObj = new Date(startDate);
            if (!isNaN(dateObj.getTime())) {
              const day = dateObj.getUTCDay();
              serviceTimeQuery.push({ 
                availabilityType: "scheduled_slots", 
                "availableTimeSlots.dayOfWeek": day 
              });
            }
          }
          
          if (startTime) {
            serviceTimeQuery.push({
              availabilityType: "scheduled_slots",
              "availableTimeSlots.startTime": { $lte: startTime },
              "availableTimeSlots.endTime": { $gt: startTime }
            });
          }

          if (serviceTimeQuery.length > 0) {
            query.$or = [
              { availabilityType: { $in: ["flexible", "date_range"] } },
              { $and: serviceTimeQuery }
            ];
          }
        }
      }

      // Expiration Filter (ONLY show items with active plan)
      // Note: Since we need to join with CommunityPayment to check expiration, 
      // we'll handle this in the aggregation pipeline or after fetching.
      // But for the initial query object, we keep it simple.
      return query;
    };

    const now = new Date();

    // 2.2 Helper for aggregation to include filtering by expiration
    const getAggregatePipeline = (colType, baseQuery) => {
      const pipeline = [
        { $match: baseQuery },
        {
          $lookup: {
            from: "communitypayments",
            localField: "communityPayment",
            foreignField: "_id",
            as: "communityPaymentDetails"
          }
        },
        {
          $unwind: {
            path: "$communityPaymentDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        // Only show if communityOfferUntill is in the future
        {
          $match: {
            "communityPaymentDetails.communityOfferUntill": { $gt: now }
          }
        }
      ];
      return pipeline;
    };

    let results = [];
    let totalCount = 0;
    const populateSelect = "name companyName profilePicture accountType representativeName _id isVerified";

    // 🎯 TYPE BASED FILTERING
    if (selectedType === "Service") {
      const baseQuery = buildCollectionQuery("Service");
      const pipeline = getAggregatePipeline("Service", baseQuery);
      
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Service.aggregate(countPipeline);
      totalCount = countResult[0]?.total || 0;

      results = await Service.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitInt }
      ]);
      
      // Manually populate createdBy (aggregation doesn't do model population easily across DBs)
      await Service.populate(results, [
        { path: "createdBy", select: populateSelect },
        { path: "specialOffer" },
        { path: "communityPayment" }
      ]);
      results = results.map(i => ({ ...i, itemType: "Service" }));
    }
    else if (selectedType === "Product") {
      const baseQuery = buildCollectionQuery("Product");
      const pipeline = getAggregatePipeline("Product", baseQuery);

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Product.aggregate(countPipeline);
      totalCount = countResult[0]?.total || 0;

      results = await Product.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitInt }
      ]);

      await Product.populate(results, [
        { path: "createdBy", select: populateSelect },
        { path: "specialOffer" },
        { path: "communityPayment" }
      ]);
      results = results.map(i => ({ ...i, itemType: "Product" }));
    }
    else if (selectedType === "ServiceRequest") {
      const baseQuery = buildCollectionQuery("ServiceRequest");
      const pipeline = getAggregatePipeline("ServiceRequest", baseQuery);

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await ServiceRequest.aggregate(countPipeline);
      totalCount = countResult[0]?.total || 0;

      results = await ServiceRequest.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitInt }
      ]);

      await ServiceRequest.populate(results, [
        { path: "createdBy", select: populateSelect },
        { path: "specialOffer" },
        { path: "communityPayment" }
      ]);
      results = results.map(i => ({ ...i, itemType: "ServiceRequest" }));
    }
    else if (selectedType === "RequestedProduct") {
      const baseQuery = buildCollectionQuery("RequestedProduct");
      const pipeline = getAggregatePipeline("RequestedProduct", baseQuery);

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await RequestedProduct.aggregate(countPipeline);
      totalCount = countResult[0]?.total || 0;

      results = await RequestedProduct.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitInt }
      ]);

      await RequestedProduct.populate(results, [
        { path: "requestedBy", select: populateSelect },
        { path: "specialOffer" },
        { path: "communityPayment" }
      ]);
      results = results.map(i => ({ ...i, createdBy: i.requestedBy, itemType: "RequestedProduct" }));
    }
    else {
      // 🌍 UNIFIED FEED (ALL TYPES)
      const fetchTypeAggregate = async (model, colType) => {
        const baseQuery = buildCollectionQuery(colType);
        const pipeline = getAggregatePipeline(colType, baseQuery);
        const data = await model.aggregate([...pipeline, { $sort: { createdAt: -1 } }, { $limit: skip + limitInt }]);
        await model.populate(data, [
          { path: colType === "RequestedProduct" ? "requestedBy" : "createdBy", select: populateSelect },
          { path: "specialOffer" },
          { path: "communityPayment" }
        ]);
        return data.map(i => ({ 
          ...i, 
          itemType: colType, 
          createdBy: colType === "RequestedProduct" ? i.requestedBy : i.createdBy 
        }));
      };

      const [srResults, rpResults, productResults, serviceResults] = await Promise.all([
        fetchTypeAggregate(ServiceRequest, "ServiceRequest"),
        fetchTypeAggregate(RequestedProduct, "RequestedProduct"),
        fetchTypeAggregate(Product, "Product"),
        fetchTypeAggregate(Service, "Service"),
      ]);

      results = [
        ...srResults,
        ...rpResults,
        ...productResults,
        ...serviceResults,
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limitInt);
      
      totalCount = results.length; // Approximate for unified feed if not fully counting all
    }

    // -------------------------------
    // 🧠 FINAL NORMALIZATION
    // -------------------------------
    const normalizedResults = results.map((item) => {
      if (item.requestedBy && !item.createdBy) {
        item.createdBy = item.requestedBy;
        delete item.requestedBy;
      }

      // --- ADD STATUS FLAGS ---
      const cp = item.communityPayment;
      item.isCommunityActive = cp ? (new Date() < new Date(cp.communityOfferUntill)) : false;
      item.communityStartDate = cp ? cp.createdAt : null;
      item.communityExpiryDate = cp ? cp.communityOfferUntill : null;

      return item;
    });

    res.status(200).json({
      offers: normalizedResults,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalCount / limitInt) || 1,
        totalItems: totalCount,
        limit: limitInt,
      },
    });
  } catch (error) {
    console.error("[getCommunityOffers Controller] Error:", error.message);
    res.status(500).json({
      message: "Internal Server Error fetching community offers.",
    });
  }
};

// @desc    Get single community offer by ID
// @route   GET /api/community-offers/:id
// @access  Public
const getCommunityOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const populateSelect = "name companyName profilePicture accountType representativeName _id isVerified";

    // Try ServiceRequest first
    let item = await ServiceRequest.findOne({ _id: id, isCommunity: true })
      .populate("createdBy", populateSelect)
      .populate("specialOffer")
      .populate("communityPayment")
      .lean();

    if (item) {
      item.itemType = "ServiceRequest";
    }

    if (!item) {
      // Try RequestedProduct
      item = await RequestedProduct.findOne({ _id: id, isCommunity: true })
        .populate("requestedBy", populateSelect)
        .populate("specialOffer")
        .populate("communityPayment")
        .lean();

      if (item) {
        item.createdBy = item.requestedBy;
        delete item.requestedBy;
        item.itemType = "RequestedProduct";
      }
    }

    if (!item) {
      // Try Product
      item = await Product.findOne({ _id: id, isCommunity: true })
        .populate("createdBy", populateSelect)
        .populate("specialOffer")
        .populate("communityPayment")
        .lean();

      if (item) {
        item.itemType = "Product";
      }
    }

    if (!item) {
      // Try Service
      item = await Service.findOne({ _id: id, isCommunity: true })
        .populate("createdBy", populateSelect)
        .populate("specialOffer")
        .populate("communityPayment")
        .lean();

      if (item) {
        item.itemType = "Service";
      }
    }

    if (!item) {
      return res.status(404).json({ message: "Community offer not found." });
    }

    // --- ADD STATUS FLAGS ---
    const cp = item.communityPayment;
    item.isCommunityActive = cp ? (new Date() < new Date(cp.communityOfferUntill)) : false;
    item.communityStartDate = cp ? cp.createdAt : null;
    item.communityExpiryDate = cp ? cp.communityOfferUntill : null;

    res.status(200).json(item);
  } catch (error) {
    console.error(`[getCommunityOfferById Controller] Error fetching offer ${req.params.id}:`, error.message);
    res.status(500).json({ message: "Internal Server Error fetching community offer." });
  }
};

/**
 * @desc    Activate or re-activate a community offer for a specific listing
 * @route   POST /api/community-offers/:itemType/:itemId/activate
 * @access  Private
 */
const activateCommunityOffer = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { durationMonths, sourceId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid Item ID." });
    }

    const modelMap = {
      Service: { model: Service, ownerField: "createdBy" },
      Product: { model: Product, ownerField: "createdBy" },
      ServiceRequest: { model: ServiceRequest, ownerField: "createdBy" },
      RequestedProduct: { model: RequestedProduct, ownerField: "requestedBy" },
    };

    const config = modelMap[itemType];
    if (!config) {
      return res.status(400).json({ message: "Invalid item type. Use Service, Product, ServiceRequest, or RequestedProduct." });
    }

    const item = await config.model.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: `${itemType} not found.` });
    }

    // Ownership check
    const ownerId = item[config.ownerField];
    if (!ownerId.equals(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. You do not own this listing." });
    }

    // Call unified logic
    const cp = await activateCommunityOfferLogic({
      user: req.user,
      item: item,
      itemType: itemType,
      durationMonths: Number(durationMonths),
      sourceId: sourceId,
    });

    // Update the item
    item.isCommunity = true;
    item.communityPayment = cp._id;
    await item.save();

    res.status(200).json({
      message: "Community offer activated successfully.",
      communityPayment: cp,
      item: item,
    });
  } catch (error) {
    console.error("[activateCommunityOffer] Error:", error.message);
    const status = error.status || 500;
    const message = error.message || "Internal Server Error activating community offer.";
    res.status(status).json({ message });
  }
};

/**
 * @desc    Partially update a community offer's content (Service or ServiceRequest)
 * @route   PATCH /api/community-offers/:itemType/:id
 * @access  Private
 */
const updateCommunityOfferContent = async (req, res) => {
  try {
    const { itemType, id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const modelMap = {
      Service: { model: Service, ownerField: "createdBy" },
      ServiceRequest: { model: ServiceRequest, ownerField: "createdBy" },
    };

    const config = modelMap[itemType];
    if (!config) {
      return res.status(400).json({
        message: "Invalid item type for community edit. Supported: Service, ServiceRequest.",
      });
    }

    const item = await config.model.findById(id);
    if (!item) {
      return res.status(404).json({ message: `${itemType} not found.` });
    }

    // Ownership check
    const ownerId = item[config.ownerField];
    if (!ownerId.equals(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized. You do not own this listing." });
    }

    // Ensure it's a community item
    if (!item.isCommunity) {
      return res.status(400).json({ message: "This item is not a community offer." });
    }

    // Apply partial updates
    const updatedItem = await config.model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Community offer updated successfully.",
      item: updatedItem,
    });
  } catch (error) {
    console.error("[updateCommunityOfferContent] Error:", error.message);
    const status = error.status || 500;
    const message = error.message || "Internal Server Error updating community offer.";
    res.status(status).json({ message });
  }
};


module.exports = {
  getCommunityOffers,
  getCommunityOfferById,
  activateCommunityOffer,
  updateCommunityOfferContent,
};
