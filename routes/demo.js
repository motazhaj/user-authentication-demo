const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  res.render("signup");
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
    inPassword ||
    inPassword.trim() < 6 ||
    inEmail !== inConfirmEmail ||
    !inEmail.includes("@")
  ) {
    console.log("Incorrect Data");
    return res.redirect("/signup");
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: inEmail });

  if (existingUser){
    console.log("User Exists")
    return res.redirect("/signup")
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

  console.log("Login Successful");
  res.redirect("/admin");
});

router.get("/admin", function (req, res) {
  res.render("admin");
});

router.post("/logout", function (req, res) {});

module.exports = router;
