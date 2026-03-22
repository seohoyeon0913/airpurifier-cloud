const store = {
  device: {
    id: process.env.DEVICE_ID || "airpurifier-001",
    secret: process.env.DEVICE_SECRET || "change-this-secret",
    online: false,
    lastSeen: null,
    status: {
      power: false,
      mode: "AUTO",
      sleep: false,
      currentDiff: 0
    },
    pendingCommand: "NONE"
  },

  oauthCodes: new Map(),
  tokens: new Map()
}

module.exports = store