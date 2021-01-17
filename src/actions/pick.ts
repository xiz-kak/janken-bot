import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'

export default function() {
  type RoundStatus = {
    [s: string]: any
  }

  app.action(/^pick_.*/, async ({ body, action, ack, respond }) => {
    await ack();

    const matchesRef = firestore.collection(`teams/${body.team.id}/matches`)
    const [match_id, round] = action.block_id.split('-')

    if (Number(round) === 0) {
      await matchesRef
        .doc(match_id)
        .collection('players')
        .doc(body.user.id)
        .set({status: "playing"}, {merge: true})
    } else if (Number(round) > 0) {
      const roundStatusDoc = await matchesRef
        .doc(match_id)
        .collection('rounds')
        .doc(String(round-1))
        .get()

      const round_status = roundStatusDoc.data() as RoundStatus
      const survivers = round_status.survivers

      if (!survivers || !survivers.includes(body.user.id)) {
        await respond({
          replace_original: false,
          text: `Sorry, you cannot join :pray:\nYou are not a surviver.`
        });
        return
      }
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
