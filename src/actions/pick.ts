import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'

export default function() {
  app.action(/^pick_.*/, async ({ body, action, ack, say, client }) => {
    await ack();

    const matchesRef = firestore.collection(`teams/${body.team.id}/matches`)
    const [match_id, round] = action.block_id.split('-')

    if (round * 1 === 0) {
      await matchesRef
        .doc(match_id)
        .collection('players')
        .doc(body.user.id)
        .set({status: "playing"}, {merge: true})
    }

    await matchesRef
      .doc(match_id)
      .collection('rounds')
      .doc(round)
      .collection('hands')
      .doc(body.user.id)
      .set({hand: action.value}, {merge: true})

    console.log("HERE")
    console.log(action)
    console.log(body);

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
