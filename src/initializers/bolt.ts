const { App } = require(`@slack/bolt`)
const { LogLevel } = require(`@slack/logger`)

const logLevel = process.env.SLACK_LOG_LEVEL || LogLevel.INFO

const config = {
  logLevel,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
}

export const app = new App(config)
