import { app } from './initializers/bolt'
import { enableRequestLog } from './middleware/request_log'
import echo from './commands/echo'
import set from './commands/set'
import get from './commands/get'
import janken from './commands/janken'
import pick from './actions/pick'

(async () => {
  const server = await app.start(process.env.PORT || 3000)

  console.log(`⚡️ Bolt app is running! PORT: ${server.address().port}`)
})()

enableRequestLog(app)
echo()
set()
get()
janken()
pick()
