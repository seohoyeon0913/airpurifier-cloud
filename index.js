require("dotenv").config()

const express = require("express")
const connector = require("./connector")
const oauthRoutes = require("./oauth")
const store = require("./store")

const app = express()
app.use(express.json())

app.get("/", (_, res) => {
  res.send("AirPurifier Cloud Bridge OK")
})

app.use(oauthRoutes)

/* =========================
   ESP32 ↔ 서버
   ========================= */
function authDevice(req, res, next) {
  const id = req.header("x-device-id")
  const secret = req.header("x-device-secret")

  if (id !== store.device.id || secret !== store.device.secret) {
    return res.status(401).send("unauthorized")
  }
  next()
}

app.get("/device/poll", authDevice, (req, res) => {
  const cmd = store.device.pendingCommand || "NONE"
  store.device.pendingCommand = "NONE"
  res.send(cmd)
})

app.post("/device/report", authDevice, (req, res) => {
  const body = req.body || {}

  store.device.online = true
  store.device.lastSeen = new Date().toISOString()
  store.device.status = {
    power: !!body.power,
    mode: body.mode || "AUTO",
    sleep: !!body.sleep,
    currentDiff: Number(body.currentDiff || 0)
  }

  res.json({ ok: true })
})

/* =========================
   디버그용
   ========================= */
app.get("/debug/status", (req, res) => {
  res.json(store.device)
})

/* =========================
   SmartThings Schema
   ========================= */
app.post("/schema", (req, res) => {
  connector.handleHttpCallback(req, res)
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})