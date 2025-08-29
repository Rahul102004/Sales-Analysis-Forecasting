const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/inventoryController");

router.get("/", ctrl.getInventory);
router.get("/stats", ctrl.getStats);
router.post("/", ctrl.addItem);
router.put("/:id", ctrl.updateItem);
router.delete("/:id", ctrl.deleteItem);

module.exports = router;
