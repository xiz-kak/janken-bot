import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'

export default function() {
  type User = {
    message: string
  }

  app.command('/get', async ({ payload, ack, context }) => {
    ack()

    // firestoreのデータを取得
    const usersRef = firestore.collection('users')
    const userDoc = await usersRef.doc(payload.user_id).get()
    const user = userDoc.data() as User

    // Slack通知
    const msg = {
      token: context.botToken,
      text: user.message,
      channel: payload.channel_id,
   }
    return app.client.chat.postMessage(msg).catch(err => {
      throw new Error(err)
    })
  })
}
