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
// app.get("/", isAuthenticated, (req, res) => {
//   res.render("index");
// });


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


app.get("/", isAuthenticated, (req, res) => {
  // console.log("Avatar: ", req.user.avatar);
  res.render("index", { user: req.user });
});

app.get('/challenge', isAuthenticated, (req, res) => {
  res.render('challenge_questions', { user: req.user });
});

const searchRoutes = require("./routes/search_routes");
app.use("/admin", searchRoutes);

const progressRoutes = require("./routes/progress_routes");
app.use("/progress", progressRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
