const SpecialOffer = require("../model/specialOffer.model");
const Product = require("../model/product.model");
const Service = require("../model/service.model");
const RequestedProduct = require("../model/requestedProduct.model");
const ServiceRequest = require("../model/serviceRequest.model");
const mongoose = require("mongoose");

// Common helper for fetching special offers
const fetchSpecialOffers = async (req, res, fixedItemType = null) => {
  try {
    const { 
      itemType, page = 1, limit = 8, status = "active", tab,
      q, category, location, providerName, type, locationPreference,
      startDate, startTime
    } = req.query;
    console.log(startDate, "startDate")
    console.log(startTime, "startTime")

    const query = {};
    if (status) query.status = status;
    
    let mappedItemType = null;
    if (tab) {
      if (tab === "productRequest") mappedItemType = "RequestedProduct";
      else if (tab === "productOffer") mappedItemType = "Product";
      else if (tab === "serviceRequest") mappedItemType = "ServiceRequest";
      else if (tab === "serviceOffer") mappedItemType = "Service";
    }

    // Use fixed item type if provided (for dedicated routes), 
    // otherwise use mappedItemType from tab, otherwise use itemType
    const effectiveItemType = fixedItemType || mappedItemType || itemType;
    if (effectiveItemType) query.itemType = effectiveItemType;

    // --- Search & Filter Logic based on base collections ---
    const isSearching = q || category || location || providerName || type || locationPreference || startDate || startTime;
    if (isSearching) {
      const User = require("../model/user.model");
      let userIds = null;
      let hasUserFilter = false;
      const userQuery = {};

      if (providerName) {
        hasUserFilter = true;
        userQuery.$or = [
          { name: { $regex: new RegExp(providerName, "i") } },
          { companyName: { $regex: new RegExp(providerName, "i") } },
          { representativeName: { $regex: new RegExp(providerName, "i") } }
        ];
      }
      if (location) {
        hasUserFilter = true;
        userQuery.location = { $regex: new RegExp(location, "i") };
      }

      if (hasUserFilter) {
        const users = await User.find(userQuery).select("_id").lean();
        userIds = users.map(u => u._id);
      }

      const searchPromises = [];
      const qRegex = q ? new RegExp(q, "i") : null;
      const catRegex = category ? new RegExp(category, "i") : null;
      
      let createdAtFilter = null;
      if (startDate) {
        let parsedDate;
        if (startDate.includes("/")) {
          // Parse MM/DD/YYYY directly into UTC to avoid local timezone offsetting
          const [month, day, year] = startDate.split("/");
          parsedDate = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));
        } else {
          parsedDate = new Date(startDate);
          // Standardize to UTC Midnight
          parsedDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
        }

        if (!isNaN(parsedDate.getTime())) {
          if (startTime) {
            const [hours, minutes] = startTime.split(':');
            parsedDate.setUTCHours(parseInt(hours || 0, 10), parseInt(minutes || 0, 10), 0, 0);
          }
          createdAtFilter = { $gte: parsedDate };
        }
      }

      if (!effectiveItemType || effectiveItemType === "Product") {
        if (!type && !locationPreference) {
          let pQuery = { isSpecial: true };
          if (qRegex) pQuery.$or = [{ name: qRegex }, { description: qRegex }, { tags: qRegex }];
          if (catRegex) pQuery.category = catRegex;
          if (userIds !== null) pQuery.createdBy = { $in: userIds };
          if (createdAtFilter) pQuery.createdAt = createdAtFilter;
          searchPromises.push(Product.find(pQuery).select("_id").lean());
        }
      }

      if (!effectiveItemType || effectiveItemType === "RequestedProduct") {
        if (!type && !locationPreference) {
          let rpQuery = { isSpecial: true };
          if (qRegex) rpQuery.$or = [{ name: qRegex }, { description: qRegex }, { tags: qRegex }];
          if (catRegex) rpQuery.category = catRegex;
          if (userIds !== null) rpQuery.requestedBy = { $in: userIds };
          if (location) rpQuery.deliveryLocation = { $regex: new RegExp(location, "i") };
          if (createdAtFilter) rpQuery.createdAt = createdAtFilter;
          searchPromises.push(RequestedProduct.find(rpQuery).select("_id").lean());
        }
      }

      if (!effectiveItemType || effectiveItemType === "Service") {
        if (!locationPreference) {
          let sQuery = { isSpecial: true };
          const sAnd = [];
          if (qRegex) sAnd.push({ $or: [{ title: qRegex }, { description: qRegex }, { tags: qRegex }] });
          if (catRegex) sQuery.category = catRegex;
          if (type) sQuery.type = type;

          if (location && !providerName) {
            // Location only: match Service.locations OR User.location
            const locOr = [{ locations: { $regex: new RegExp(location, "i") } }];
            if (userIds !== null) locOr.push({ createdBy: { $in: userIds } });
            sAnd.push({ $or: locOr });
          } else if (userIds !== null) {
            // ProviderName provided (possibly with Location): strictly use userIds
            sQuery.createdBy = { $in: userIds };
          }
          if (sAnd.length > 0) sQuery.$and = sAnd;
          if (createdAtFilter) sQuery.createdAt = createdAtFilter;

          searchPromises.push(Service.find(sQuery).select("_id").lean());
        }
      }

      if (!effectiveItemType || effectiveItemType === "ServiceRequest") {
        if (!type) {
          let srQuery = { isSpecial: true };
          const srAnd = [];
          if (qRegex) srAnd.push({ $or: [{ title: qRegex }, { description: qRegex }, { tags: qRegex }] });
          if (catRegex) srQuery.category = catRegex;
          if (locationPreference) srQuery.locationPreference = locationPreference;
          
          if (location && !providerName) {
            const locOr = [{ "onSiteAddresses.city": { $regex: new RegExp(location, "i") } }];
            if (userIds !== null) locOr.push({ createdBy: { $in: userIds } });
            srAnd.push({ $or: locOr });
          } else if (userIds !== null) {
            srQuery.createdBy = { $in: userIds };
          }
          if (srAnd.length > 0) srQuery.$and = srAnd;
          if (createdAtFilter) srQuery.createdAt = createdAtFilter;

          searchPromises.push(ServiceRequest.find(srQuery).select("_id").lean());
        }
      }

      const searchResults = await Promise.all(searchPromises);
      const matchedItemIds = searchResults.flat().map(doc => doc._id);

      if (matchedItemIds.length === 0) {
        return res.status(200).json({
          offers: [],
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages: 0,
            totalItems: 0,
            limit: parseInt(limit, 10),
          },
        });
      }
      query.item = { $in: matchedItemIds };
    }

    const count = await SpecialOffer.countDocuments(query);

    let populatePath = "createdBy";
    if (effectiveItemType === "RequestedProduct") {
      populatePath = "requestedBy";
    }

    const offersQuery = SpecialOffer.find(query);

    if (!effectiveItemType) {
      offersQuery.populate({
        path: "item",
        populate: [
          {
            path: "createdBy",
            select: "name companyName profilePicture accountType location representativeName _id isVerified",
            options: { strictPopulate: false },
          },
          {
            path: "requestedBy",
            select: "name companyName profilePicture accountType location representativeName _id isVerified",
            options: { strictPopulate: false },
          },
        ],
        options: { strictPopulate: false },
      });
    } else {
      offersQuery.populate({
        path: "item",
        populate: {
          path: populatePath,
          select: "name companyName profilePicture accountType location representativeName _id isVerified",
          options: { strictPopulate: false },
        },
      });
    }

    const offers = await offersQuery
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .lean();

    // Normalize the owner field to 'createdBy' in the response for consistency if it was 'requestedBy'
    const normalizedOffers = offers.map((offer) => {
      if (offer.item && offer.item.requestedBy && !offer.item.createdBy) {
        offer.item.createdBy = offer.item.requestedBy;
        delete offer.item.requestedBy;
      }
      return offer;
    });

    res.status(200).json({
      offers: normalizedOffers,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("[fetchSpecialOffers Helper] Error:", error.message);
    res.status(500).json({ message: "Internal Server Error fetching special offers." });
  }
};

// @desc    Get all special offers
// @route   GET /api/special-offers
// @access  Public
const getSpecialOffers = async (req, res) => {
  await fetchSpecialOffers(req, res);
};

// @desc    Get all special product offers
// @route   GET /api/special-offers/products
// @access  Public
const getSpecialProductOffers = async (req, res) => {
  await fetchSpecialOffers(req, res, "Product");
};

// @desc    Get all special service offers
// @route   GET /api/special-offers/services
// @access  Public
const getSpecialServiceOffers = async (req, res) => {
  await fetchSpecialOffers(req, res, "Service");
};

// @desc    Get all special requested product offers
// @route   GET /api/special-offers/requested-products
// @access  Public
const getSpecialRequestedProductOffers = async (req, res) => {
  await fetchSpecialOffers(req, res, "RequestedProduct");
};

// @desc    Get all special service request offers
// @route   GET /api/special-offers/service-requests
// @access  Public
const getSpecialServiceRequestOffers = async (req, res) => {
  await fetchSpecialOffers(req, res, "ServiceRequest");
};

// @desc    Get single special offer by ID
// @route   GET /api/special-offers/:id
// @access  Public
const getSpecialOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Special Offer ID format." });
    }

    const offer = await SpecialOffer.findById(id).populate({
      path: "item",
      populate: [
        {
          path: "createdBy",
          select: "name companyName profilePicture accountType location representativeName _id isVerified",
          options: { strictPopulate: false },
        },
        {
          path: "requestedBy",
          select: "name companyName profilePicture accountType location representativeName _id isVerified",
          options: { strictPopulate: false },
        },
      ],
      options: { strictPopulate: false },
    });

    if (!offer) {
      return res.status(404).json({ message: "Special offer not found." });
    }

    res.status(200).json(offer);
  } catch (error) {
    console.error(`[getSpecialOfferById Controller] Error fetching offer ${req.params.id}:`, error.message);
    res.status(500).json({ message: "Internal Server Error fetching special offer." });
  }
};

// @desc    Toggle special offer status (active/inactive)
// @route   PATCH /api/special-offers/:id/toggle
// @access  Private (Owner only)
const toggleSpecialOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "active" or "inactive"

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Special Offer ID format." });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'inactive'." });
    }

    const offer = await SpecialOffer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: "Special offer not found." });
    }

    // Verify ownership
    const ItemModel = mongoose.model(offer.itemType);
    const item = await ItemModel.findById(offer.item);

    if (!item) {
      return res.status(404).json({ message: "Associated listing not found." });
    }

    const ownerId = item.createdBy || item.requestedBy;
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to toggle this special offer." });
    }

    // Update Offer Status
    offer.status = status;
    await offer.save();

    // Update Listing isSpecial flag
    item.isSpecial = (status === "active");
    await item.save();

    res.status(200).json({
      message: `Special offer successfully set to ${status}.`,
      isSpecial: item.isSpecial,
      offer
    });
  } catch (error) {
    console.error(`[toggleSpecialOfferStatus Controller] Error:`, error.message);
    res.status(500).json({ message: "Internal Server Error toggling special offer." });
  }
};

module.exports = {
  getSpecialOffers,
  getSpecialOfferById,
  getSpecialProductOffers,
  getSpecialServiceOffers,
  getSpecialRequestedProductOffers,
  getSpecialServiceRequestOffers,
  toggleSpecialOfferStatus,
};
