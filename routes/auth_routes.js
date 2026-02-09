
const express = require("express");
// const{register,login,logout}=require("../controller/auth_controller");
const router = express.Router();
const passport = require("passport");
const User = require("../model/user");

// ======================= REGISTER =======================
// router.post("/register", register);

// ======================= LOGIN =======================
// router.post("/login", login);
// ======================= LOGOUT =======================
// Microsoft login
router.get(
  "/microsoft",
  passport.authenticate("azuread-openidconnect", {
    prompt: "select_account",
  })
);

// Callback
router.all(
  "/microsoft/callback",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/login",
  }),
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });

      if (!user) {
        return res.redirect("/login");
      }

      // ✅ If SAP or LeetCode missing, go to complete profile page
      if (!user.SAP_ID || !user.leetcode_id) {
        return res.redirect("/auth/complete-profile");
      }

      return res.redirect("/");
    } catch (err) {
      console.log(err);
      return res.redirect("/login");
    }
  }
);

// Show complete profile page
router.get("/complete-profile", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect("/auth/microsoft");
  }

  res.render("complete_profile");
});

// Save complete profile
router.post("/complete-profile", async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { SAP_ID, leetcode_id } = req.body;

    if (!SAP_ID || !leetcode_id) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!/^\d{8}$/.test(SAP_ID)) {
      return res.status(400).json({ message: "SAP ID must be 8 digits" });
    }

    // check SAP ID exists
    const existingSAP = await User.findOne({ SAP_ID });
    if (existingSAP) {
      return res.status(400).json({ message: "SAP ID already exists" });
    }

    // check leetcode exists
    const existingLC = await User.findOne({ leetcode_id });
    if (existingLC) {
      return res.status(400).json({ message: "LeetCode ID already exists" });
    }

    await User.findOneAndUpdate(
      { email: req.user.email },
      { SAP_ID, leetcode_id },
      { new: true }
    );

    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
  });
});

module.exports = router;