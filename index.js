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

// ----------------------------------------------------

const authRoutes = require("./routes/auth_routes");
app.use("/auth", authRoutes);

const isAuthenticated = require("./middleware/auth_middleware");
app.get("/", isAuthenticated, (req, res) => {
  res.render("index");
});


// ----------------------------------------------------

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
// -------------------------------- LeetCode Router ----------------------------
const leetcodeRoutes = require("./routes/leetcode_router");
app.use("/leetcode" ,leetcodeRoutes);


app.get("/a", isAuthenticated, (req, res) => {
  res.render("leetcode", { user: req.user });
});


app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
