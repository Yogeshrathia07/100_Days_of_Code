const jwt = require("jsonwebtoken");
const User = require("../model/user");

const isAuthenticated = async (req, res, next) => {
  try {
    // ✅ Microsoft session login
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    // ✅ JWT login
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) return res.redirect("/login");

    req.user = user;
    next();
  } catch (err) {
    return res.redirect("/login");
  }
};

module.exports = isAuthenticated;
