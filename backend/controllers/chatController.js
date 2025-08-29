const { askRia } = require("../services/chatService");

async function postAsk(req, res) {
  try {
    const { message } = req.body;
    const answer = await askRia(message);
    res.json({ answer });
  } catch (err) {
    console.error("❌ Controller error:", err.message);
    res.status(500).json({ error: "Failed to process chat" });
  }
}

module.exports = { postAsk };
