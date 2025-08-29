const express = require("express");
const { postAsk } = require("../controllers/chatController");

const router = express.Router();

// POST /api/chat/ask
router.post("/ask", postAsk);

module.exports = router;
