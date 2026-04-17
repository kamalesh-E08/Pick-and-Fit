import mongoose from "mongoose";

const PhotoProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    personName: {
      type: String,
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["men", "women", "kids", ""],
      default: "",
    },
    ageGroup: {
      type: String,
      enum: ["0-2", "3-5", "6-9", "10-14", ""],
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for faster queries
PhotoProfileSchema.index({ userEmail: 1, createdAt: -1 });

const PhotoProfile =
  mongoose.models.PhotoProfile ||
  mongoose.model("PhotoProfile", PhotoProfileSchema);

export default PhotoProfile;
