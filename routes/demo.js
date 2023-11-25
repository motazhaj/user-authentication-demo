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
  res.render("login");
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
      console.log("Incorrect Data");
      return res.redirect("/signup");
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
    return res.redirect("/signup");
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
    console.log("Could not find email");
    return res.redirect("/login");
  }

  const passwordMatch = await bcrypt.compare(inPassword, existingUser.password);

  if (!passwordMatch) {
    console.log("Password incorrect");
    return res.redirect("/login");
  }

  req.session.user = { id: existingUser._id, email: existingUser.email };
  req.session.isAuthenticated = true;
  req.session.save(() => {
    console.log("Login Successful");
    res.redirect("/admin");
  });
});

router.get("/admin", function (req, res) {
  if (!req.session.isAuthenticated) {
    return res.status(401).render("401");
  }
  res.render("admin");
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect("/login");
});

module.exports = router;
