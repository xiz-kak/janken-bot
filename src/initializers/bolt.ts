const { App, ExpressReceiver } = require(`@slack/bolt`)
const { LogLevel } = require(`@slack/logger`)

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: `/slack/events`
})

const logLevel = process.env.SLACK_LOG_LEVEL || LogLevel.INFO

const config = {
  logLevel,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver
}

export const app = new App(config)
