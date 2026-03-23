const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    aiRequestsCount: {
      type: Number,
      default: 0,
    },
    embeddingsCreated: {
      type: Number,
      default: 0,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

usageSchema.index({ owner: 1, project: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("Usage", usageSchema);
