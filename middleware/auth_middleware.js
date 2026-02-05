const jwt = require("jsonwebtoken");
const User = require("../model/user");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email }).select("-password");

    if (!user) {
      return res.redirect("/login");
    }

    req.user = user; // ✅ attach user data to request
    next();

  } catch (error) {
    return res.redirect("/login");
  }
};

module.exports = isAuthenticated;
