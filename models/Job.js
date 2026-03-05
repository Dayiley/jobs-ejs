const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Please provide a company name"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    position: {
      type: String,
      required: [true, "Please provide a position title"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    status: {
      type: String,
      required: [true, "Please select a status"],
      enum: {
        values: ["applied", "interview", "offer", "rejected"],
        message: "Status must be applied, interview, offer, or rejected",
      },
      default: "applied",
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);