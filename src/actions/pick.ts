import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'
import * as SlackClient from '../clients/slack_client'

export default function() {
  type RoundStatus = {
    [s: string]: any
  }

  app.action(/^pick_.*/, async ({ client, payload, body, action, ack, respond }) => {
    await ack();

    const matchesRef = firestore.collection(`teams/${body.team.id}/matches`)
    const [match_id, round] = action.block_id.split('-')

    let survivors : string[] = []
    if (Number(round) === 0) {
      const handsCol = await matchesRef
        .doc(match_id)
        .collection('players')
        .get()

      if (handsCol.docs.length >= 10) {
        await respond({
          replace_original: false,
          text: `Sorry, it's full!! 10 players joined already :pray:`
        });
        return
      }

      await matchesRef
        .doc(match_id)
        .collection('players')
        .doc(body.user.id)
        .set({status: "playing"}, {merge: true})
    } else {
      const previousRoundDoc = await matchesRef
        .doc(match_id)
        .collection('rounds')
        .doc(String(round-1))
        .get()

      const previous_round = previousRoundDoc.data() as RoundStatus
      survivors = previous_round.survivors

      if (!survivors || !survivors.includes(body.user.id)) {
        await respond({
          replace_original: false,
          text: `Sorry, you cannot join in the middle of the match :pray:`
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

    const handsCol = await matchesRef
      .doc(match_id)
      .collection('rounds')
      .doc(round)
      .collection('hands')
      .get()

    let picked_player_ids : string[] = []
    handsCol.forEach(hand => {
      const data = hand.data()
      picked_player_ids.push(hand.id)
    })

    const currentRoundDoc = await matchesRef
      .doc(match_id)
      .collection('rounds')
      .doc(round)
      .get()

    const current_round = currentRoundDoc.data() as RoundStatus
    const players_ts = current_round.players_ts

    const [channel_id, ts] = match_id.split('_')
    await SlackClient.update_players(
      client,
      channel_id,
      players_ts,
      survivors,
      picked_player_ids
    )
  });
}
