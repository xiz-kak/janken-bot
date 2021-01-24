import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'
import * as SlackClient from '../clients/slack_client'

// TODOs:
// - move some logics to SlackClient
// - show ready/thinking (not use ephemeral)
// - add text to postMessage APIs
// - refactor

export default function() {
  app.command('/janken', async (args) => { janken(args) })
  app.command('/janken_dev', async (args) => { janken(args) })

  const janken = async ({ command, ack, say, client, context }) => {
    await ack();

    const res_kickoff = await SlackClient.post_kickoff(
      say,
      command.user_id
    )

    const res_round_0 = await SlackClient.post_round_0_actions(
      client,
      res_kickoff.channel,
      res_kickoff.ts
    )

    // console.log(res_kickoff)
    // console.log(res_round_0)

    const matchesRef = firestore.collection(`teams/${res_kickoff.message.team}/matches`)
    const match_id = res_kickoff.channel + '_' + res_kickoff.ts
    const match = {
      kickoff_user_id: res_kickoff.message.user,
      team_id: res_kickoff.message.team,
      channel_id: res_kickoff.channel,
      kickoff_ts: res_kickoff.ts,
      kickoff_at: new Date()
    }
    await matchesRef
      .doc(match_id)
      .set(match)

    setTimeout(async () => {
      await client.chat.delete({
        channel: res_round_0.channel,
        ts: res_round_0.ts
      });

      const players = await matchesRef
        .doc(match_id)
        .collection('players')
        .get()

      const player_ids = players.docs.map(player => {
        return player.id
      })

      SlackClient.update_kickoff(
        client,
        res_kickoff.channel,
        res_kickoff.ts,
        command.user_id,
        player_ids
      )

      if (player_ids.length > 1) {
        judge_round(matchesRef, client, match_id, 0)
      }
    },11000);
  }
}

const judge_round = async (matchesRef, client, match_id, round) => {
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

  // if arr_hands.length === 0
  //   Post "- (No one joined)" in thread
  //   Post "Janken was cancelled" in broadcast
  // if arr_hands.length === 1
  //   Post "Round: - hogehoge :v: (WIN)" in thread
  //   Post "Winner: @hogehoge" in broadcast
  // else
  //   if arr_distinct_hands.length ===2
  //     Post round_result in thread
  //     if one_win
  //       Post match_result in broadcast
  //     else
  //       kick_next_round <- include if round >=9
  //   else
  //     Post round_result in thread
  //     kick_next_round


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

  // console.log(player_hands)
  // console.log(arr_hands)
  // console.log(arr_distinct_hands)

  let round_status : { [s: string]: any } = {}
  if (arr_distinct_hands.length === 2) {
    const loser_idx = ((arr_distinct_hands[0] - arr_distinct_hands[1] + 3) % 3) - 1
    const loser_hand = arr_distinct_hands[loser_idx]
    const winner_hand = arr_distinct_hands[1-loser_idx]
    const winner_ids = player_hands[winner_hand]

    // console.log(`Winner hand: ${winner_hand}`)
    // console.log(`Loser  hand: ${loser_hand}`)

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
      survivers: winner_ids
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
      kick_next_round(matchesRef, client, match_id, round, winner_ids)

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
    kick_next_round(matchesRef, client, match_id, round, player_ids)
    round_status.status = "draw"
    round_status.survivers = player_ids
  }

  await matchesRef
    .doc(match_id)
    .collection('rounds')
    .doc(String(round))
    .set(round_status)
}

const kick_next_round = async (matchesRef, client, match_id, current_round, player_ids) => {
  const [channel_id, ts] = match_id.split('_')

  if (current_round >= 9) {
    const text_winners = player_ids.map(p_id => {
      return `<@${p_id}> `
    })

    const msg_match_result = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `10 rounds over!\n*Final winners: ${ text_winners }* :tada:`
          }
        }
      ]
    }

    await client.chat.postMessage({
      channel: channel_id,
      thread_ts: ts,
      blocks: msg_match_result.blocks
    });

    return
  }

  const next_round = current_round + 1

  const text_players = player_ids.map(p_id => {
    return `<@${p_id}> `
  })

  const attach_round_n = [
    {
      color: "#f0ad4e",
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${ text_players.join('') } Hi, survivers!!\nPick your hand in *10 sec* ...`
          }
        },
        {
          "type": "actions",
          "block_id": `${channel_id}_${ts}-${next_round}`,
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": ":fist:",
                "emoji": true
              },
              "value": "0",
              "action_id": "pick_0"
            },
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": ":v:",
                "emoji": true
              },
              "value": "1",
              "action_id": "pick_1"
            },
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": ":hand:",
                "emoji": true
              },
              "value": "2",
              "action_id": "pick_2"
            }
          ]
        }
      ]
    }
  ]

  const res_round_n = await client.chat.postMessage({
    channel: channel_id,
    thread_ts: ts,
    attachments: attach_round_n
  });

  setTimeout(async () => {
    client.chat.delete({
      channel: res_round_n.channel,
      ts: res_round_n.ts
    });

    judge_round(matchesRef, client, match_id, next_round)
  },11000);
}
