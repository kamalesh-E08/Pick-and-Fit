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
