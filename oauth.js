const express = require("express")
const crypto = require("crypto")
const store = require("./store")

const router = express.Router()

router.get("/oauth/authorize", (req, res) => {
  const { client_id, redirect_uri, state } = req.query

  const username = req.query.username || process.env.DEV_USERNAME
  const password = req.query.password || process.env.DEV_PASSWORD

  if (username !== process.env.DEV_USERNAME || password !== process.env.DEV_PASSWORD) {
    return res.status(401).send("invalid credentials")
  }

  const code = crypto.randomUUID()
  store.oauthCodes.set(code, { client_id })

  const url = new URL(redirect_uri)
  url.searchParams.set("code", code)
  if (state) url.searchParams.set("state", state)

  res.redirect(url.toString())
})

router.post("/oauth/token", express.urlencoded({ extended: true }), (req, res) => {
  const { grant_type, code, client_id, client_secret } = req.body

  if (client_id !== process.env.OAUTH_CLIENT_ID || client_secret !== process.env.OAUTH_CLIENT_SECRET) {
    return res.status(401).json({ error: "invalid_client" })
  }

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type" })
  }

  if (!store.oauthCodes.has(code)) {
    return res.status(400).json({ error: "invalid_code" })
  }

  store.oauthCodes.delete(code)

  const accessToken = crypto.randomUUID()
  const refreshToken = crypto.randomUUID()

  store.tokens.set(accessToken, { user: "dev-user" })

  res.json({
    token_type: "Bearer",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600
  })
})

module.exports = router