const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let sessionInputData = req.session.inputData;
  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      confirmEmail: "",
      password: "",
    };
  }

  req.session.inputData = null;

  return res.render("signup", { inputData: sessionInputData });
});

router.get("/login", function (req, res) {
  let sessionInputData = req.session.inputData;
  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      password: "",
    };
  }

  req.session.inputData = null;
  res.render("login", { inputData: sessionInputData });
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const inEmail = userData.email;
  const inConfirmEmail = userData["confirm-email"];
  const inPassword = userData.password;

  if (
    !inEmail ||
    !inConfirmEmail ||
    !inPassword ||
    inPassword.trim() < 6 ||
    inEmail !== inConfirmEmail ||
    !inEmail.includes("@")
  ) {
    req.session.inputData = {
      hasError: true,
      message: "Invalid input, please check again",
      email: inEmail,
      confirmEmail: inConfirmEmail,
      password: inPassword,
    };
    req.session.save(() => {
      res.redirect("/signup");
    });
    return;
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: inEmail });

  if (existingUser) {
    console.log("User Exists");
    req.session.inputData = {
      hasError: true,
      message: "this email already exists",
      email: inEmail,
      confirmEmail: inConfirmEmail,
      password: inPassword,
    };
    req.session.save(() => {
      res.redirect("/signup");
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(inPassword, 12);

  const user = {
    email: inEmail,
    password: hashedPassword,
  };

  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const inEmail = userData.email;
  const inPassword = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: inEmail });

  if (!existingUser) {
    req.session.inputData = {
      hasError: true,
      message: "This Email doesn't exist",
      email: inEmail,
      password: inPassword,
    };
    req.session.save(() => {
      res.redirect("/login");
    });
    return;
  }

  const passwordMatch = await bcrypt.compare(inPassword, existingUser.password);

  if (!passwordMatch) {
    req.session.inputData = {
      hasError: true,
      message: "Incorrect password",
      email: inEmail,
      password: inPassword,
    };
    req.session.save(() => {
      res.redirect("/login");
    });
    return;
  }

  req.session.user = {
    id: existingUser._id,
    email: existingUser.email,
    isAdmin: existingUser.isAdmin,
  };
  req.session.isAuthenticated = true;
  req.session.save(() => {
    console.log("Login Successful");
    res.redirect("/profile");
  });
});

router.get("/admin", async function (req, res) {
  if (!req.locals.isAuthenticated) {
    return res.status(401).render("401");
  }


  if (!res.locals.isAdmin) {
    return res.status(403).render("403");
  }
  res.render("admin");
});

router.get("/profile", function (req, res) {
  if (!res.local.isAuthenticated) {
    return res.status(401).render("401");
  }
  res.render("profile");
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect("/login");
});

module.exports = router;
