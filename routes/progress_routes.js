const express = require("express");
const router = express.Router();
const User = require("../model/user");
const isAuthenticated = require("../middleware/auth_middleware");

// ===================== SAVE/TOGGLE COMPLETION =====================
router.post("/toggle", isAuthenticated, async (req, res) => {
  try {
    const { day } = req.body;
    const userId = req.user._id;

    if (!day) {
      return res.status(400).json({ success: false, message: "Day is required" });
    }

    const user = await User.findById(userId);

    const alreadyCompleted = user.challengeProgress.find((d) => d.day === day);

    if (alreadyCompleted) {
      // remove day
      user.challengeProgress = user.challengeProgress.filter((d) => d.day !== day);
    } else {
      // add day with timestamp
      user.challengeProgress.push({
        day: day,
        completedAt: new Date()
      });
    }

    await user.save();

    return res.json({
      success: true,
      challengeProgress: user.challengeProgress
    });

  } catch (err) {
    console.log("Toggle Progress Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===================== GET ALL COMPLETED DAYS =====================
router.get("/get", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    res.json({
      success: true,
      challengeProgress: user.challengeProgress || []
    });

  } catch (err) {
    console.log("Get Progress Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
