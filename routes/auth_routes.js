
const express = require("express");
const{register,login,logout}=require("../controller/auth_controller");
const router = express.Router();
const passport = require("passport");

// ======================= REGISTER =======================
router.post("/register", register);

// ======================= LOGIN =======================
router.post("/login", login);
// ======================= LOGOUT =======================
// router.get("/logout", logout);
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
      return res.redirect("/");
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // session cookie
      res.redirect("/login"); // or /auth/microsoft
    });
  });
});


// ======================= Microsoft Authentication =======================


// Microsoft Login
router.get(
  "/microsoft",
  passport.authenticate("azuread-openidconnect", {
    prompt: "select_account"
  })
);


// Callback
router.post(
  "/microsoft/callback",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/");
  }
);




module.exports = router;
