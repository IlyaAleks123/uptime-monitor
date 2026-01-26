const axios = require("axios");
const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const yaml = require("js-yaml");
const TelegramBot = require("node-telegram-bot-api");

app.use(cors());
app.use(express.json());

const TELEGRAM_TOKEN = "8536238878:AAF_yhMjix-jJzFm5xVdYjMrj3C015N3dF0";
const CHAT_ID = "7747272668";
const GROUP_ID = "-1003559534697";
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

const file = fs.readFileSync("/app/config/monitors.yaml", "utf8");
const baseMonitors = yaml.load(file);
console.log("Loaded baseMonitors:", baseMonitors);

let monitors = baseMonitors.map(m => ({
  ...m,
  status: "unknown",
  lastCheck: null,
  responseTime: null,
  interval: m.interval || 180,
  httpCode: null,
  failCount: 0
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

    const response = await axios.get(monitor.url, {
      timeout: 10000,        // ждём максимум 10 секунд
      validateStatus: () => true // не бросать ошибку на 4xx/5xx
    });

    const responseTime = Date.now() - start;

    monitor.httpCode = response.status;
    monitor.responseTime = responseTime;

    monitor.status = "up";
    monitor.lastCheck = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Kyiv" });
    monitor.failCount = 0;

    if (previousStatus === "down") {
      monitor.status = "up";
      sendAlert(`🟢 Up: ${monitor.url}`);

    } else {
      monitor.status = "up";
    }

  } catch (error) {
    monitor.httpCode = null;
    monitor.responseTime = null;
    monitor.lastCheck = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Kyiv" });

    monitor.failCount++;

    if (monitor.failCount >= 2 && monitor.status !== "down") {
      monitor.status = "down";
      sendAlert(`🔴 Down: ${monitor.url}`);
    }
  }
}

function startMonitoring() {
  for (const monitor of monitors) {
    const intervalMs = monitor.interval * 1000;

    setInterval(() => {
      checkMonitor(monitor);
    }, intervalMs);

    // первая проверка сразу
    checkMonitor(monitor);
  }
}

startMonitoring();

// bot.sendMessage(GROUP_ID, "🟢 Сервис запущен и работает");

function sendAlert(message) {
  bot.sendMessage(GROUP_ID, message);
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

