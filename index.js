const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
connectDB();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());   

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ---------------------- Microsoft Authentication ----------------------
const session = require("express-session");
const passport = require("passport");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

require("./config/microsoftAuth");



// const {isAuthenticated}= require("./middleware/auth_middleware");
const isAuthenticated= require("./middleware/auth_middleware");

const leetcodeRoutes = require("./routes/leetcode_router");
const searchRoutes = require("./routes/search_routes")
const progressRoutes = require("./routes/progress_routes");
const authRoutes = require("./routes/auth_routes");
// ----------------------------------------------------

app.use("/leetcode" ,leetcodeRoutes);
app.use("/admin", searchRoutes);
app.use("/progress", progressRoutes);
app.use("/auth", authRoutes);

// ----------------------------------------------------

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
// -------------------------------- LeetCode Router ----------------------------

// -------------------------------- Admin Routes ----------------------------

app.get("/", isAuthenticated, (req, res) => {
  res.render("index", { user: req.user });
});
app.get('/challenge', isAuthenticated, (req, res) => {
  res.render('challenge_questions', { user: req.user });
});

// -------------------------------- Admin Routes ----------------------------
// app.get("/admin-login", (req, res) => {
//   res.render("admin_login", { error: null });
// });

const challengeRoutes = require("./routes/progress_routes");
app.use("/challenge-api", challengeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
