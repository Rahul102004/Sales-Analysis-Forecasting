require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs').promises;
const path = require('path');

const inventoryService = require("./services/inventoryService");
const { loadCSV } = require("./config/dbLoader");
const overviewRoutes = require("./routes/overviewRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const chatRoutes = require("./routes/chatRoutes");
const seedProducts = require("./utils/seed"); // ✅ Seeder for initial products
const csvStore = require("./utils/csvStore");
const app = express();

app.use(cors());
app.use(express.json());

// Variable to store the CSV data
let csvData = '';
// Variable to store the chat history
let chatHistory = [];

// Load dataset (for analytics) and the CSV file
(async () => {
  try {
    loadCSV();
    csvStore.load();
    const csvFilePath = path.join(__dirname, 'dataset.csv');
    csvData = await fs.readFile(csvFilePath, 'utf8');
    console.log("✅ dataset.csv loaded successfully.");
  } catch (err) {
    console.error("❌ Error loading dataset.csv:", err.message);
  }

  // ✅ Seed only if no inventory data
  try {
    await seedProducts();
  } catch (err) {
    console.error("❌ Error seeding products:", err.message);
  }
})();

// Routes
app.use("/api", overviewRoutes);
app.use("/api/inventory", inventoryRoutes);
// app.use("/api/chat", chatRoutes); // The chat route is defined below, so this line is not needed.

// Start server
const apiKey = "AIzaSyCeric0wS08nT55CVLn13NnDN_enM1Z62I";
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not set. Set it in .env");
}
const genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// The system prime has been updated to match the frontend's "Ria" persona and scope.
// It is now focused on sales and inventory data.
const SYSTEM_PRIME = `
You are "Ria", a helpful, non-judgmental assistant for inventory and sales data.
STRICT SCOPE: Only answer questions related to inventory, sales data, stock levels,
product IDs, sales trends, and related business metrics. If the user asks outside
this scope, politely steer the conversation back to inventory or sales analysis.
if they ask about sales and analysis use csv data to check top selling ,and all selling data etc
do not mention that u analyse the csv. if they ask anything about analysis use csv to ans but not mention that u have csv connected
if someone ask about inventory gites its status it last dateof changeing and only inventory data not the dtaset data

STYLE: Conversational, concise, and supportive. Avoid long monologues. Use bullet points if helpful.
DO NOT generate medical, legal, financial investment, or relationship advice.
DO NOT roleplay as anything other than an inventory and sales data analyst.
Do not use '*' in your conversation. Your generated text should be well-formatted.

`;

app.post("/api/chat/ask", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }
    const rows = await inventoryService.getAll();
    // Add user message to history
    chatHistory.push({ role: "user", text: message });

    // Format chat history for the prompt
    const formattedHistory = chatHistory.map(chat => `${chat.role.toUpperCase()}: ${chat.text}`).join('\n');
    
    // Convert rows to a readable JSON string for the prompt
    const formattedInventoryData = JSON.stringify(rows, null, 2);

    // Combine the CSV data and chat history with the user's message for the prompt.
    const prompt = `inventory data:\n${formattedInventoryData}\n\nCSV Data for Context:\n${csvData}\n\nChat History:\n${formattedHistory}\n\n${SYSTEM_PRIME}\n\nUSER: ${message}\nBOT:`;
    
    const result = await model.generateContent(prompt);
    // Use a fallback message if the model response is empty.
    const botReplyRaw = result?.response?.text?.() || "I'm sorry, I couldn't find an answer to that question based on the provided data.";

    // The original code requested no asterisks, so we'll keep that formatting.
    let botReply = botReplyRaw.trim();
    botReply = botReply.replace(/\*/g, '');

    // Add bot reply to history
    chatHistory.push({ role: "bot", text: botReply });

    // The frontend expects the response to have an 'answer' property.
    res.json({ answer: botReply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Something went wrong processing your request." });
  }
});
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);
