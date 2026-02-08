// Admin authentication middleware

const isAdmin = (req, res, next) => {
  if (req.cookies && req.cookies.admin === "true") {
    next();
  } else {
    // res.redirect("/admin/admin-login");
    return res.render('admin_login', { error: null });
  }
};

module.exports = isAdmin;
