const jwt = require("jsonwebtoken");
const User = require("../model/user");

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (!req.user.SAP_ID || !req.user.leetcode_id) {
      return res.redirect("/auth/complete-profile");
    }
    return next();
  }

  return res.redirect("/login");
};

module.exports = isAuthenticated;
