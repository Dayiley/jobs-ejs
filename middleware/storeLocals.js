const { getToken } = require("host-csrf");

const storeLocals = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.info = req.flash("info");
  res.locals.errors = req.flash("error");


  res.locals._csrf = getToken(req, res);

  next();
};

module.exports = storeLocals;