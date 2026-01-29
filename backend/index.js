const axios = require("axios");
const express = require("express");
const app = express();
const TelegramBot = require("node-telegram-bot-api");

app.use(express.json());

const TELEGRAM_TOKEN = "8536238878:AAF_yhMjix-jJzFm5xVdYjMrj3C015N3dF0";
const CHAT_ID = "7747272668";
const GROUP_ID = "-1003559534697";
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function checkDb() {
  try {
    const res = await pool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
    process.exit(1);
  }
}

checkDb();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.get("/api/monitors", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        url,
        status,
        last_check    AS "lastCheck",
        response_time AS "responseTime",
        http_code     AS "httpCode",
        interval
      FROM monitors
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});


app.post("/api/monitors", async (req, res) => {
  const { url, interval } = req.body;

  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO monitors (url, interval, status, fail_count)
       VALUES ($1, $2, 'unknown', 0)
       RETURNING *`,
      [url, interval || 180]
    );

    const monitor = result.rows[0];

    // делаем первую проверку и ждём её
    await checkMonitor(monitor);

    // запускаем цикл
    startMonitorLoop(monitor);

    // читаем обновлённые данные из БД
    const { rows } = await pool.query(
      `SELECT 
        id,
        url,
        status,
        last_check    AS "lastCheck",
        response_time AS "responseTime",
        http_code     AS "httpCode",
        interval
      FROM monitors
      WHERE id = $1`,
      [monitor.id]
    );

    // отдаём уже реальный статус
    res.json(rows[0]);


  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "URL already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


app.delete("/api/monitors/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query("DELETE FROM monitors WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

async function checkMonitor(monitor) {
  const { rows } = await pool.query(
    "SELECT status, fail_count FROM monitors WHERE id = $1",
    [monitor.id]
  );

  const previousStatus = rows[0].status;
  const previousFailCount = rows[0].fail_count;

  try {
    const start = Date.now();

    const response = await axios.get(monitor.url, {
      timeout: 10000,        // ждём максимум 10 секунд
      validateStatus: () => true // не бросать ошибку на 4xx/5xx
    });

    const responseTime = Date.now() - start;

    if (previousStatus === "down") {
      sendAlert(`🟢 Up: ${monitor.url}`);

    };

    await pool.query(
      `UPDATE monitors
      SET status = 'up',
        last_check = NOW(),
        response_time = $1,
        http_code = $2,
        fail_count = 0
      WHERE id = $3`,
      [responseTime, response.status, monitor.id]
    );


  } catch (error) {
    const newFailCount = previousFailCount + 1;

    let newStatus = previousStatus;
    let needAlert = false;

    if (newFailCount >= 2 && previousStatus !== "down") {
      newStatus = "down";
      needAlert = true;
    }

    await pool.query(
      `UPDATE monitors
      SET last_check = NOW(),
          response_time = NULL,
          http_code = NULL,
          fail_count = $1,
          status = $2
      WHERE id = $3`,
      [newFailCount, newStatus, monitor.id]
    );

    if (needAlert) {
      sendAlert(`🔴 Down: ${monitor.url}`);
    }
  }
}

async function startMonitorLoop(monitor) {
  while (true) {
    await new Promise(r => setTimeout(r, monitor.interval * 1000));
    await checkMonitor(monitor);
  }
}

async function initMonitoring() {
  const { rows } = await pool.query("SELECT * FROM monitors");

  for (const monitor of rows) {
    startMonitorLoop(monitor);
  }
}

initMonitoring();

// bot.sendMessage(GROUP_ID, "🟢 Сервис запущен и работает");

function sendAlert(message) {
  bot.sendMessage(GROUP_ID, message);
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
