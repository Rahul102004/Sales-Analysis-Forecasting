// backend/services/chatService.js

async function askRia(message) {
  const q = message.toLowerCase();

  if (q.includes("hi")) {
    return "Hello 👋! I’m Ria. I can help you with inventory or sales questions.";
  }

  if (q.includes("overview of inventory")) {
    return (
      "📦 Inventory Overview:\n\n" +
      "- Total Products: 8\n" +
      "- High Stock: R03 (40), N02BE (90), M01AB (100)\n" +
      "- Medium Stock: N05B (50), M01AE (80), R06 (30)\n" +
      "- Low Stock: N02BA (60), N05C (70)\n\n" +
      "⚠️ Note: N02BA and N05C are marked as Low."
    );
  }

  if (q.includes("r03")) {
    return (
      "🔎 Analysis on R03 Product:\n\n" +
      "- Current Quantity: 40\n" +
      "- Stock Status: High\n" +
      "- Last Updated: 27/08/2025 01:13\n\n" +
      "✅ Inventory looks stable for R03."
    );
  }

  // default fallback
  return "🤔 Sorry, I can only answer 'hi', 'overview of inventory', or 'analysis on R03 product' for now.";
}

module.exports = { askRia };
