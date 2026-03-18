require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");

const passport = require("passport");
const passportInit = require("./passport/passportInit");

const connectDB = require("./db/connect");

const cookieParser = require("cookie-parser");
const { csrf } = require("host-csrf");
const auth = require("./middleware/auth");

const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");

// choose database depending on environment
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV === "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

// 1) EJS + body parser
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// 2) cookie-parser
app.use(cookieParser(process.env.SESSION_SECRET));

// 3) CSRF middleware
app.use(
  csrf({
    cookie: {
      sameSite: "strict",
      secure: false,
    },
  })
);

// 4) Session
const store = new MongoDBStore({
  uri: mongoURL,
  collection: "mySessions",
});

store.on("error", (error) => {
  console.log("Session store error:", error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParms.cookie.secure = true;
}

app.use(session(sessionParms));

// 5) Passport
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// 6) Flash
app.use(flash());

// 7) storeLocals
app.use(require("./middleware/storeLocals"));

// security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

app.use(xss());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// set content type for tests
app.use((req, res, next) => {
  if (req.path === "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

// ===== ROUTES =====
app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sessions", require("./routes/sessionRoutes.js"));

app.get("/secretWord", (req, res) => {
  if (!req.session.secretWord) req.session.secretWord = "syzygy";
  res.render("secretWord", { secretWord: req.session.secretWord });
});

app.post("/secretWord", (req, res, next) => {
  const newWord = (req.body.secretWord || "").trim();

  if (!newWord) {
    req.flash("error", "Please enter a word.");
    return res.redirect("/secretWord");
  }

  if (newWord.toUpperCase()[0] === "P") {
    req.flash("error", "That word won't work!");
    req.flash("error", "You can't use words that start with p.");
  } else {
    req.session.secretWord = newWord;
    req.flash("info", "The secret word was changed.");
  }

  req.session.save((err) => {
    if (err) return next(err);
    res.redirect("/secretWord");
  });
});

app.use("/jobs", auth, require("./routes/jobs"));

// testing route
app.get("/multiply", (req, res) => {
  const first = Number(req.query.first);
  const second = Number(req.query.second);
  const result = first * second;

  if (Number.isNaN(result)) {
    return res.json({ result: "NaN" });
  }

  res.json({ result });
});

// 404 + error
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send(err.message);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

if (process.env.NODE_ENV !== "test") {
  start();
}

module.exports = { app, start };
