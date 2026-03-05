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


// 1) EJS + body parser 
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

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
  uri: process.env.MONGO_URI,
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

app.use(helmet());
app.use(xss());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// ===== ROUTES =====
app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sessions", require("./routes/sessionRoutes.js"));

app.get("/secretWord", (req, res) => {
  if (!req.session.secretWord) req.session.secretWord = "syzygy";
  res.render("secretWord", { secretWord: req.session.secretWord });
});

app.use("/jobs", auth, require("./routes/jobs"));

app.post("/secretWord", (req, res) => {
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
  await connectDB(process.env.MONGO_URI);
  app.listen(port, () => console.log(`Server is listening on port ${port}...`));
};

start();