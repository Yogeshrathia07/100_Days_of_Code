const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    SAP_ID: {
      type: String,
      unique: true,
      trim: true,
      minlength: 8,
      maxlength: 8,
    },

    leetcode_id: { type: String, unique: true, trim: true, default: null },

    password: { type: String },

    // ✅ NEW FIELD
    challengeProgress: [
      {
        day: { type: Number, required: true },
        completedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
