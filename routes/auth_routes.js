
const express = require("express");
const{register,login,logout}=require("../controller/auth_controller");
const router = express.Router();
// ======================= REGISTER =======================
router.post("/register", register);

// ======================= LOGIN =======================
router.post("/login", login);
// ======================= LOGOUT =======================
router.get("/logout", logout);


module.exports = router;
