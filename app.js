const path = require("path");

const express = require("express");
const session = require("express-session");
const mongodbStore = require("connect-mongodb-session");

const db = require("./data/database");
const demoRoutes = require("./routes/demo");

const MongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new MongoDBStore({
  uri: "mongodb://127.0.0.1.:27017",
  databaseName: "user-auth-demo",
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "secret-test",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

app.use(async (req, res, next) => {
  const user = req.session.user;
  const isAuthenticated = req.session.isAuthenticated;

  if (!user || !isAuthenticated) {
    return next();
  }

  const userData = await db
    .getDb()
    .collection("users")
    .findOne({ _id: user.id });
  const isAdmin = userData.isAdmin;

  res.locals.isAuthenticated = isAuthenticated;
  res.locals.isAdmin = isAdmin;

  next();
});

app.use(demoRoutes);

app.use(function (error, req, res, next) {
  res.render("500");
});

db.connectToDatabase().then(function () {
  app.listen(3000);
});
