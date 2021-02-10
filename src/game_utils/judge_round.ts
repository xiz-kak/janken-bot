import { kick_next_round } from '../game_utils/kick_next_round'
import * as SlackClient from '../clients/slack_client'

export async function judge_round(matchesRef, client, match_id, round) {
  const [channel_id, ts] = match_id.split('_')

  const hands = await matchesRef
    .doc(match_id)
    .collection('rounds')
    .doc(String(round))
    .collection('hands')
    .get()

  let player_hands = {
    0: [],
    1: [],
    2: []
  }

  let arr_hands : number[] = []

  hands.forEach(hand => {
    const data = hand.data()
    player_hands[data.hand].push(hand.id)
    arr_hands.push(Number(data.hand))
  })

  if (arr_hands.length === 0) {
    SlackClient.post_0_join_round(
      client,
      channel_id,
      ts,
      round
    )

    return
  } else if (arr_hands.length === 1) {
    SlackClient.post_1_join_round(
      client,
      channel_id,
      ts,
      round,
      player_hands[arr_hands[0]][0]
    )

    return
  }

  const arr_distinct_hands = [...new Set(arr_hands)]

  let round_status : { [s: string]: any } = {}
  if (arr_distinct_hands.length === 2) {
    const loser_idx = ((arr_distinct_hands[0] - arr_distinct_hands[1] + 3) % 3) - 1
    const loser_hand = arr_distinct_hands[loser_idx]
    const winner_hand = arr_distinct_hands[1-loser_idx]
    const winner_ids = player_hands[winner_hand]

    await SlackClient.post_round_result_win(
      client,
      channel_id,
      ts,
      round,
      winner_hand,
      winner_ids
    )

    round_status = {
      winner_hand: winner_hand,
      loser_hand: loser_hand,
      survivors: winner_ids
    }

    if (winner_ids.length === 1) {
      await SlackClient.post_match_result_one_win(
        client,
        channel_id,
        ts,
        winner_ids[0]
      )

      round_status.status = "one_win"
    } else {
      kick_next_round(matchesRef, client, match_id, round, winner_ids, judge_round)

      round_status.status = "multi_win"
    }
  } else {
    await SlackClient.post_round_result_draw(
      client,
      channel_id,
      ts,
      round
    )

    let player_ids : string[] = []
    Object.keys(player_hands).forEach(k => {
      player_ids.push(...player_hands[k])
    });
    kick_next_round(matchesRef, client, match_id, round, player_ids, judge_round)
    round_status.status = "draw"
    round_status.survivors = player_ids
  }

  await matchesRef
    .doc(match_id)
    .collection('rounds')
    .doc(String(round))
    .set(round_status, {merge: true})
}
