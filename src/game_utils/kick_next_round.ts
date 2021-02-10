import * as SlackClient from '../clients/slack_client'

export async function kick_next_round(matchesRef, client, match_id, current_round, player_ids, judge_round) {
  const [channel_id, ts] = match_id.split('_')

  if (current_round >= 9) {
    await SlackClient.post_match_result_max_round(
      client,
      channel_id,
      ts,
      player_ids
    )

    return
  }

  const next_round = current_round + 1

  const res_round_n = await SlackClient.post_round_actions(
    client,
    channel_id,
    ts,
    next_round,
    player_ids
  )

  const res_players = await SlackClient.post_players(
    client,
    channel_id,
    ts,
    player_ids
  )

  await matchesRef
    .doc(match_id)
    .collection('rounds')
    .doc(String(next_round))
    .set({players_ts: res_players.ts})

  setTimeout(async () => {
    client.chat.delete({
      channel: res_round_n.channel,
      ts: res_round_n.ts
    });

    client.chat.delete({
      channel: res_players.channel,
      ts: res_players.ts
    });

    judge_round(matchesRef, client, match_id, next_round)
  },11000);
}
