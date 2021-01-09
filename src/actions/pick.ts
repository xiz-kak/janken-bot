import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'

export default function() {
  app.action(/^pick_.*/, async ({ body, action, ack, respond }) => {
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

    await respond({
      replace_original: false,
      text: `You picked ${ action.text.text }`
    });
  });
}
