const { SchemaConnector } = require("st-schema")
const store = require("./store")

function switchState(value) {
  return {
    component: "main",
    capability: "st.switch",
    attribute: "switch",
    value
  }
}

function fanSpeedState(value) {
  return {
    component: "main",
    capability: "st.fanSpeed",
    attribute: "fanSpeed",
    value
  }
}

function sleepState(value) {
  return {
    component: "sleep",
    capability: "st.switch",
    attribute: "switch",
    value
  }
}

function currentStates() {
  const s = store.device.status
  const fan = s.mode === "AUTO" ? 1 : s.mode === "STRONG" ? 2 : s.mode === "MEDIUM" ? 3 : 4

  return [
    switchState(s.power ? "on" : "off"),
    fanSpeedState(fan),
    sleepState(s.sleep ? "on" : "off")
  ]
}

const connector = new SchemaConnector()

connector.discoveryHandler((accessToken, response) => {
  response.addDevice(store.device.id, "AirPurifier", "c2c-air-conditioner")
    .manufacturerName("Custom")
    .modelName("ESP32 AirPurifier")
    .roomHint("Living Room")
    .deviceHandlerType("c2c-air-conditioner")
})

connector.stateRefreshHandler((accessToken, response) => {
  response.addDevice(store.device.id, currentStates())
})

connector.commandHandler((accessToken, response, devices) => {
  devices.forEach(device => {
    device.commands.forEach(command => {
      if (command.capability === "st.switch" && command.component === "main") {
        store.device.pendingCommand = "POWER"
      }

      if (command.capability === "st.switch" && command.component === "sleep") {
        store.device.pendingCommand = "SLEEP"
      }

      if (command.capability === "st.fanSpeed" && command.command === "setFanSpeed") {
        const speed = command.arguments[0]
        if (speed === 1) store.device.pendingCommand = "FAN_AUTO"
        else if (speed === 2) store.device.pendingCommand = "FAN_STRONG"
        else if (speed === 3) store.device.pendingCommand = "FAN_MEDIUM"
        else if (speed === 4) store.device.pendingCommand = "FAN_WEAK"
      }
    })

    response.addDevice(device.externalDeviceId, currentStates())
  })
})

module.exports = connector