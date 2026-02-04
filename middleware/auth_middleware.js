const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // store user data
    next();
  } catch (error) {
    return res.redirect("/login");
  }
};

module.exports = isAuthenticated;
