const axios = require("axios");
const express = require("express");
const cors = require("cors");
const app = express();

const TelegramBot = require("node-telegram-bot-api");
const TELEGRAM_TOKEN = "8536238878:AAF_yhMjix-jJzFm5xVdYjMrj3C015N3dF0";
const CHAT_ID = "7747272668";
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

const CHECK_INTERVAL_SECONDS = Number(process.env.CHECK_INTERVAL_SECONDS || 180);
const CHECK_INTERVAL_MS = CHECK_INTERVAL_SECONDS * 1000;

const fs = require("fs");
const yaml = require("js-yaml");

const file = fs.readFileSync("/app/config/monitors.yaml", "utf8");
const baseMonitors = yaml.load(file);
console.log("Loaded baseMonitors:", baseMonitors);

app.use(cors());
app.use(express.json());

let monitors = baseMonitors.map(m => ({
  ...m,
  status: "unknown",
  lastCheck: null,
  responseTime: null
}));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.get("/api/monitors", (req, res) => {
  res.json(monitors);
});

async function checkMonitor(monitor) {
  const previousStatus = monitor.status;

  try {
    const start = Date.now();

    await axios.get(monitor.url, {
      timeout: 10000,        // ждём максимум 10 секунд
      validateStatus: () => true // не бросать ошибку на 4xx/5xx
    });

    const responseTime = Date.now() - start;

    monitor.status = "up";
    monitor.lastCheck = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Kyiv",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    monitor.responseTime = responseTime;
  } catch (error) {
    monitor.status = "down";
    monitor.lastCheck = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Kyiv",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    monitor.responseTime = null;
  }

  if (previousStatus === "up" && monitor.status === "down") {
      sendAlert(`🔴 Down: ${monitor.url}`);
  }

  if (previousStatus === "down" && monitor.status === "up") {
      sendAlert(`🟢 Up: ${monitor.url}`);
  }
}

async function checkAllMonitors() {
  console.log("Checking all monitors...");

  for (const monitor of monitors) {
    await checkMonitor(monitor);
  }

  console.log("Check finished");
}

setInterval(() => {
  checkAllMonitors();
}, CHECK_INTERVAL_MS);
checkAllMonitors();

function sendAlert(message) {
  bot.sendMessage(CHAT_ID, message);
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

