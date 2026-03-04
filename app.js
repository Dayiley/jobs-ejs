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

// EJS + form parsing
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Mongo session store
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

// 1) Session
app.use(session(sessionParms));

// 2) Passport
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// 3) Flash
app.use(flash());

// 4) storeLocals
app.use(require("./middleware/storeLocals"));

app.get("/debug-user", (req, res) => {
  res.json({
    hasUser: !!req.user,
    user: req.user || null,
    session: req.session,
  });
});

// 5) Routes
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

app.get("/secretWord", (req, res) => {
  if (!req.session.secretWord) {
    req.session.secretWord = "syzygy";
  }
  res.render("secretWord", { secretWord: req.session.secretWord });
});

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

  res.redirect("/secretWord");
});

// 404 + error
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
