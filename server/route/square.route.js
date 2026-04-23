const express = require("express");
const { squareHealthCheck } = require("../controller/square.controller");

const router = express.Router();

// Step 1 integration route: validate Square credentials and connectivity
router.get("/health", squareHealthCheck);

module.exports = router;
