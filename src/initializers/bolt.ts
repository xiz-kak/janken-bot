const { App } = require(`@slack/bolt`)
const { LogLevel } = require(`@slack/logger`)
import { receiver } from './receiver'

const logLevel = process.env.SLACK_LOG_LEVEL || LogLevel.INFO

const config: { [key: string]: any } = {
  logLevel,
  receiver
}

if (process.env.SLACK_OAUTH_ENABLED != '1') {
  config.token = process.env.SLACK_BOT_TOKEN
}

export const app = new App(config)
