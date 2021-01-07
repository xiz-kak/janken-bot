import { app } from '../initializers/bolt'

export default function() {
  app.action(/^pick_.*/, async ({ body, action, ack, say, client }) => {
    await ack();


    const msg_pick_hand = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `<@${ body.user.id }> picked ${ action.text.text }`
          }
        }
      ]
    }

    await say(msg_pick_hand);
  });

}
