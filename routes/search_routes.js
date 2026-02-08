const express = require("express");
const router = express.Router();
const User = require("../model/user");
const isAdmin = require("../middleware/admin_middleware");

// Search page
router.get("/search",isAdmin, (req, res) => {
  res.render("search_student", { student: null, error: null });
});

// Search by SAP ID
router.post("/search", isAdmin, async (req, res) => {
  const { sapid } = req.body;

  const student = await User.findOne({ SAP_ID: sapid });

  if (!student) {
    return res.render("search_student", {
      student: null,
      error: "Student not found!",
    });
  }

  if (!student.leetcode_id) {
    return res.render("search_student", {
      student: null,
      error: "This student has no LeetCode ID saved!",
    });
  }

  res.render("search_student", { student, error: null });
});

// ✅ NEW: API to fetch challenge progress data
router.get("/challenge-progress/:sapid", isAdmin, async (req, res) => {
  try {
    const student = await User.findOne({ SAP_ID: req.params.sapid });
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      challengeProgress: student.challengeProgress || [],
      totalCompleted: student.challengeProgress?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/challenge-heatmap150/:sapid", isAdmin, async (req, res) => {
  try {
    const sapid = req.params.sapid;

    const student = await User.findOne({ SAP_ID: sapid });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      challengeProgress: student.challengeProgress || [],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



// -------------------------------- Admin Routes ----------------------------
router.post("/admin-login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    // console.log("Admin logged in successfully");
    res.cookie("admin", "true");
    return res.redirect("/admin/search");
  }

  res.render("admin_login", { error: "Wrong Admin Password" });
});

router.get("/admin-logout", (req, res) => {
  res.clearCookie("admin");
  res.redirect("/");
});



module.exports = router;