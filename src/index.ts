import { app } from './initializers/bolt'
import { enableRequestLog } from './middlewares/request_log'
import janken from './commands/janken'
import pick from './actions/pick'

(async () => {
  const server = await app.start(process.env.PORT || 3000)

  const oauth_mode = process.env.SLACK_OAUTH_ENABLED === "1" ? "(OAuth MODE)" : ""

  console.log(`⚡️ Bolt app is running! PORT: ${ server.address().port } ${ oauth_mode }`)
})()

enableRequestLog(app)
janken()
pick()
