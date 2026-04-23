const SellerCommissionOverride = require("../model/sellerCommissionOverride.model");
const User = require("../model/user.model");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// Get all verified sellers with their override status
const getSellersWithOverrides = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const matchStage = { isSeller: true, isVerified: true };
  
  if (search) {
    matchStage.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const result = await User.aggregate([
    { $match: matchStage },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { name: 1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $lookup: {
              from: "sellercommissionoverrides",
              localField: "_id",
              foreignField: "sellerId",
              as: "override"
            }
          },
          {
            $project: {
              name: 1,
              email: 1,
              profilePicture: 1,
              isSeller: 1,
              isVerified: 1,
              accountType: 1,
              companyName: 1,
              representativeName: 1,
              subscription: 1,
              createdAt: 1,
              override: { $arrayElemAt: ["$override", 0] }
            }
          },
          {
            $set: {
              override: {
                $cond: {
                  if: { $ifNull: ["$override", false] },
                  then: {
                    $mergeObjects: [
                      "$override",
                      {
                        durationDays: {
                          $cond: {
                            if: {
                              $and: [
                                { $eq: [{ $ifNull: ["$override.durationDays", null] }, null] },
                                { $ne: [{ $ifNull: ["$override.untilDate", null] }, null] }
                              ]
                            },
                            then: {
                              $round: [
                                {
                                  $divide: [
                                    { $subtract: ["$override.untilDate", "$override.updatedAt"] },
                                    1000 * 60 * 60 * 24
                                  ]
                                },
                                0
                              ]
                            },
                            else: "$override.durationDays"
                          }
                        }
                      }
                    ]
                  },
                  else: "$override"
                }
              }
            }
          },
          {
            $addFields: {
              isOverRided: {
                $cond: {
                  if: { $ifNull: ["$override", false] },
                  then: true,
                  else: false
                }
              }
            }
          }
        ]
      }
    }
  ]);

  const total = result[0].metadata[0]?.total || 0;
  const sellers = result[0].data;

  res.status(200).json({
    success: true,
    data: sellers,
    pagination: {
      total,
      page: parseInt(page),
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// Get seller commission override
const getSellerCommissionOverride = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ success: false, message: "Invalid Seller ID" });
  }

  const override = await SellerCommissionOverride.findOne({ sellerId });
  let overrideData = override ? override.toObject() : null;

  if (overrideData && (overrideData.durationDays === null || overrideData.durationDays === undefined) && overrideData.untilDate) {
    overrideData.durationDays = Math.round((new Date(overrideData.untilDate) - new Date(overrideData.updatedAt)) / (1000 * 60 * 60 * 24));
  }
  
  res.status(200).json({ 
    success: true, 
    data: overrideData
  });
});

// Save seller commission override
const saveSellerCommissionOverride = asyncHandler(async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: "Invalid Seller ID" });
    }

    const { percentage, durationDays } = req.body;
    
    if (percentage === undefined || percentage === null) {
      return res.status(400).json({ success: false, message: "Percentage is required" });
    }

    // Calculate untilDate
    let untilDate = null;
    if (durationDays && Number(durationDays) > 0) {
      untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + parseInt(durationDays));
    }

    const override = await SellerCommissionOverride.findOneAndUpdate(
      { sellerId },
      { 
        percentage: Number(percentage),
        durationDays: (durationDays !== undefined && durationDays !== null && durationDays !== "") ? Number(durationDays) : null,
        untilDate: untilDate,
        updatedBy: req.user?._id 
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Seller commission override saved successfully",
      data: override
    });
  } catch (error) {
    console.error("Error saving seller commission override:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

// Delete seller commission override
const deleteSellerCommissionOverride = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ success: false, message: "Invalid Seller ID" });
  }

  await SellerCommissionOverride.findOneAndDelete({ sellerId });
  res.status(200).json({ 
    success: true, 
    message: "Seller commission override deleted. Falling back to global settings." 
  });
});

module.exports = {
  getSellersWithOverrides,
  getSellerCommissionOverride,
  saveSellerCommissionOverride,
  deleteSellerCommissionOverride
};
