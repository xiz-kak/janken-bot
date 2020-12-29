import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'

export default function() {
  app.command('/set', async ({ payload, ack, context }) => {
    ack()
    const usersRef = firestore.collection('users')
    const user = {
      message: payload.text,
    }
    // firestoreにデータ登録
    await usersRef
      .doc(payload.user_id)
      .set(user)

    // 成功をSlack通知
    const msg = {
      token: context.botToken,
      text: 'メッセージを登録しました',
      channel: payload.channel_id,
    }
    return app.client.chat.postMessage(msg).catch(err => {
      throw new Error(err)
    })
  })
}
