const User = require("../models/User");
const parseValidationErrors = require("../utils/parseValidationErrors");

const registerShow = (req, res) => {
  res.render("register");
};

const registerDo = async (req, res, next) => {
  try {
    const { name, email, password, password1 } = req.body;

    if (password !== password1) {
      req.flash("error", "The passwords entered do not match.");
      return res.render("register");
    }

    await User.create({ name, email, password });

    req.flash("info", "Registration successful. You can log on now.");
    return res.redirect("/sessions/logon");
  } catch (e) {
    if (e.name === "ValidationError") {
      parseValidationErrors(e, req);
      return res.render("register");
    }

    if (e.name === "MongoServerError" && e.code === 11000) {
      req.flash("error", "That email address is already registered.");
      return res.render("register");
    }

    return next(e);
  }
};

const logoff = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    req.session.destroy((err2) => {
      if (err2) console.log(err2);
      res.redirect("/");
    });
  });
};

const logonShow = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("logon");
};

module.exports = {
  registerShow,
  registerDo,
  logoff,
  logonShow,
};
