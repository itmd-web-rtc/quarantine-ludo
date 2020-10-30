var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

/* GET create room. */
router.get("/create-room", function (req, res, next) {
  res.render("index", { title: "Create Room" });
});
module.exports = router;
