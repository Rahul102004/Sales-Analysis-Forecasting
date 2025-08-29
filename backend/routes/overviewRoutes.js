const express = require("express");
const {
  listProducts,
  getOverview,
  getProductOverview,
} = require("../controllers/overviewController");

const router = express.Router();

router.get("/products", listProducts);
router.get("/overview", getOverview);
router.get("/overview/:product", getProductOverview);

module.exports = router;
