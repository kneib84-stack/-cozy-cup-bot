const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "https://kneib84-stack.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "100kb" }));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID;

let bot;

if (BOT_TOKEN) {
  bot = new TelegramBot(BOT_TOKEN);
}

app.get("/", (req, res) => {
  res.send("Cozy Cup bot is running!");
});

app.post("/order", async (req, res) => {
  try {
    if (!bot || !OWNER_CHAT_ID) {
      return res.status(500).json({
        success: false,
        error: "Bot is not configured"
      });
    }

    const { items, total } = req.body;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid order items"
      });
    }

    const lines = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const name = String(item.name || "").trim();
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (
        !name ||
        name.length > 100 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100 ||
        !Number.isSafeInteger(price) ||
        price < 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid item data"
        });
      }

      calculatedTotal += price * quantity;

      lines.push(
        `${name} × ${quantity} — ${price * quantity} ₽`
      );
    }

    if (
      !Number.isSafeInteger(calculatedTotal) ||
      calculatedTotal > 10000000
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid total"
      });
    }

    const message =
      "☕ НОВЫЙ ЗАКАЗ — COZY CUP\n\n" +
      lines.join("\n") +
      "\n\n💰 Итого: " + calculatedTotal + " ₽";

    await bot.sendMessage(OWNER_CHAT_ID, message);

    res.json({ success: true });
  } catch (error) {
    console.error("Order error:", error.message);

    res.status(500).json({
      success: false,
      error: "Could not send order"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Cozy Cup server started on port ${PORT}`);
});
