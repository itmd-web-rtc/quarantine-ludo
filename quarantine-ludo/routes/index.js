'use strict';

var express = require('express');
var router = express.Router();
var generateRoomURL = require("../lib/generate-random-url");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Quarantine Ludo' });
  
/* GET create room. */
router.get("/create-room", function (req, res, next) {
  res.redirect(`/${generateRoomURL.randomRoom(3, 4, 3)}`);
});

/* GET Endpoint to accept the correct URL */
router.get("/:room([a-z]{3}-[a-z]{4}-[a-z]{3}$)", function (req, res, next) {
  const namespace = req.params["room"];
  res.render("index", { title: `Room ${namespace}`, namespace: namespace });
});


module.exports = router;
