const mongoose = require("mongoose");

const TimeSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      // Format: HH:MM (e.g., "09:00")
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // Validates HH:MM format
    },
    endTime: {
      // Format: HH:MM (e.g., "17:00")
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // Validates HH:MM format
      validate: [
        function (endTime) {
          // Custom validator to ensure endTime > startTime
          if (!this.startTime) return true; // If startTime is not set, no comparison needed
          return endTime > this.startTime;
        },
        "End time must be after start time for the same day.",
      ],
    },
  },
  { _id: false }
); // _id: false because these are subdocuments in an array

const ServiceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["on-site", "remote", "other"],
      required: true,
    },
    category: {
      type: String,
    },
    subcategory: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    priceType: {
      type: String,
      enum: ["per project", "per hour"],
      required: true,
    },
    // --- NEW AVAILABILITY FIELDS ---
    availabilityType: {
      type: String,
      enum: ["flexible", "scheduled_slots", "date_range"], // Added 'date_range' for completeness
      required: true,
      default: "flexible",
    },
    availabilityInfo: {
      // For 'flexible' or 'date_range' textual description
      type: String,
      trim: true,
      // Required if availabilityType is 'flexible' or 'date_range'
      // This kind of conditional requirement is better handled in controller logic or pre-save hooks if complex
    },
    availableTimeSlots: {
      // For 'scheduled_slots'
      type: [TimeSlotSchema],
      default: [],
      // Validate that this is not empty if availabilityType is 'scheduled_slots'
      // This is also better handled in controller logic or pre-save hooks.
      // Mongoose 'required' on array means array must exist, not that it must be non-empty.
    },
    locations: {
      type: [String],
      validate: {
        validator: function (v) {
          if (this.type === "on-site") {
            return (
              Array.isArray(v) &&
              v.length > 0 &&
              v.every((loc) => typeof loc === "string" && loc.trim().length > 0)
            );
          }
          return true;
        },
        message:
          "Locations (at least one non-empty string) are required for on-site services.",
      },
      default: undefined, // Ensure it's not an empty array if not on-site, unless intended
    },
    travelFee: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: function (v) {
          if (this.type === "on-site") {
            return typeof v === "number" && v >= 0;
          }
          return true;
        },
        message:
          "Travel fee (0 or more) must be specified for on-site services if type is on-site.",
      },
    },
    media: [
      {
        type: String,
        required: false,
      },
    ],
    // References to Review model
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    coreSkills: {
      // Renamed from 'skills' for clarity, focuses on primary skills for THIS service
      type: [String],
      default: [],
      validate: [
        (val) => val.length <= 10,
        "{PATH} exceeds the limit of 10 skills",
      ],
    },
    keyDeliverables: {
      // What the client gets
      type: [String],
      default: [],
      validate: [
        (val) => val.length <= 10,
        "{PATH} exceeds the limit of 10 deliverables",
      ],
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "junior", "mid-level", "senior", "manager", "director"],
      default: "entry",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "paused", "pending_verification"], // Added pending_verification
      default: "active",
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Special Offer Reference
    isSpecial: {
      type: Boolean,
      default: false,
    },
    isCommunity: {
      type: Boolean,
      default: false,
    },
    specialOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialOffer",
    },
    communityPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPayment",
    },
    communityOfferUntill: {
      type: Date,
    },
    // --- SUBSCRIPTION FIELDS ---
    isSubscriptionEnabled: {
      type: Boolean,
      default: false,
    },
    subscriptionFrequencies: {
      type: [String],
      enum: ["weekly", "monthly"],
      default: [],
    },
  },
  { timestamps: true }
);

// Example of pre-save hook for complex validation (optional but good practice)
ServiceSchema.pre("save", function (next) {
  if (
    this.availabilityType === "scheduled_slots" &&
    (!this.availableTimeSlots || this.availableTimeSlots.length === 0)
  ) {
    return next(
      new Error(
        "For 'scheduled_slots' availability, at least one time slot is required in the schema."
      )
    );
  }
  if (
    (this.availabilityType === "flexible" ||
      this.availabilityType === "date_range") &&
    (!this.availabilityInfo || this.availabilityInfo.trim() === "")
  ) {
    return next(
      new Error(
        "Availability information is required for flexible/date_range types in the schema."
      )
    );
  }
  if (
    this.type === "on-site" &&
    (this.locations === undefined || this.locations.length === 0)
  ) {
    // Handled by validator, but double check if default behavior is desired
  }
  next();
});

const Service = mongoose.model("Service", ServiceSchema);

module.exports = Service;
