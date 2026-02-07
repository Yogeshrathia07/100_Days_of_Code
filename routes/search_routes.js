const express = require("express");
const router = express.Router();
const User = require("../model/user");

// Search page
router.get("/search", (req, res) => {
  res.render("search_student", { student: null, error: null });
});

// Search by SAP ID
router.post("/search", async (req, res) => {
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

module.exports = router;
