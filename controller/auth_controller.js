const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const fetch = require("node-fetch");

// ======================= VERIFY LEETCODE USERNAME =======================
async function verifyLeetCodeUsername(username) {
  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      },
      body: JSON.stringify({
        query,
        variables: { username }
      })
    });

    const data = await response.json();

    return data.data && data.data.matchedUser;

  } catch (error) {
    console.log("LeetCode verification error:", error.message);
    return null;
  }
}

// ======================= REGISTER =======================
module.exports.register = async (req, res) => {
  try {
    const { name, email, SAP_ID, leetcode_id, password } = req.body;

    // validation
    if (!name || !email || !SAP_ID || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // SAP ID validation
    if (!/^\d{8}$/.test(SAP_ID)) {
      return res.status(400).json({ message: "SAP ID must be exactly 8 digits" });
    }

    // check existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // check existing SAP ID
    const existingSAP = await User.findOne({ SAP_ID });
    if (existingSAP) {
      return res.status(400).json({ message: "SAP ID already exists" });
    }

    // verify leetcode username if entered
    if (leetcode_id && leetcode_id.trim() !== "") {
      const valid = await verifyLeetCodeUsername(leetcode_id.trim());

      if (!valid) {
        return res.status(400).json({ message: "Invalid LeetCode username" });
      }

      // check existing leetcode id
      const existingLeetcode = await User.findOne({ leetcode_id: leetcode_id.trim() });
      if (existingLeetcode) {
        return res.status(400).json({ message: "LeetCode ID already exists" });
      }
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const newUser = await User.create({
      name,
      email,
      SAP_ID,
      leetcode_id: leetcode_id ? leetcode_id.trim() : null,
      password: hashedPassword
    });

    // token
    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        SAP_ID: newUser.SAP_ID,
        leetcode_id: newUser.leetcode_id
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================= LOGIN =======================
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        SAP_ID: user.SAP_ID,
        leetcode_id: user.leetcode_id
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================= LOGOUT =======================
module.exports.logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0
  });

  res.redirect("/login");
};
