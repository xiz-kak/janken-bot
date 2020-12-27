import { app } from '../initializers/bolt'

export default function() {
  app.command('/echo', async (args) => { echo(args) })
  app.command('/echo_dev', async (args) => { echo(args) })

  const echo = ({ command, ack, say }) => {
    ack()

    say(`発言：${command.text}`)
  }

}
