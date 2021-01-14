import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'

export default function() {
  app.command('/janken', async (args) => { janken(args) })
  app.command('/janken_dev', async (args) => { janken(args) })

  const janken = async ({ command, ack, say, client, context }) => {
    await ack();

    const msg_kickoff = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `<@${command.user_id}> challenges <!here> to play Janken!`
          }
        }
      ]
    }
    const res_kickoff = await say(msg_kickoff);

    const attach_round_0 = [
      {
        color: "good",
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Pick your hand in *10 sec* to join..."
            }
          },
          {
            "type": "actions",
            "block_id": `${res_kickoff.channel}_${res_kickoff.ts}-0`,
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

    const res_round_0 = await client.chat.postMessage({
      channel: res_kickoff.channel,
      attachments: attach_round_0
    });

    console.log(res_kickoff)
    console.log(res_round_0)

    setTimeout(async () => {
      await client.chat.delete({
        channel: res_round_0.channel,
        ts: res_round_0.ts
      });

      const players = await matchesRef
        .doc(match_id)
        .collection('players')
        .get()

      const arr_player_ids = players.docs.map(player => {
        return player.id
      })

      let text_players : string
      if (arr_player_ids.length === 0) {
        text_players = "- No one joined :cry:"
      } else if (arr_player_ids.length === 1) {
        text_players = `- Only <@${ arr_player_ids[0] }> joined.\nJanken was not started :cry: (2+ players are needed)`
      } else {
        text_players = arr_player_ids.map(p_id => { return `- <@${ p_id }> joined`}).join('\n')
      }

      const msg_kickoff_replace = {
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `<@${command.user_id}> challenges <!here> to play Janken!\n${text_players}`
            }
          }
        ]
      }

      client.chat.update({
        channel: res_kickoff.channel,
        ts: res_kickoff.ts,
        blocks: msg_kickoff_replace.blocks
      });

      if (arr_player_ids.length > 1) {
        judge_round(matchesRef, client, match_id, 0)
      }
    },11000);
  }
}

const judge_round = async (matchesRef, client, match_id, round) => {
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

  // TODO if arr_hands.length === 0 (everyone skipped) or 1, close match

  const arr_distinct_hands = [...new Set(arr_hands)]

  console.log(player_hands)
  console.log(arr_hands)
  console.log(arr_distinct_hands)

  let round_status : { [s: string]: any } = {}
  if (arr_distinct_hands.length === 2) {
    const loser_idx = ((arr_distinct_hands[0] - arr_distinct_hands[1] + 3) % 3) - 1
    const loser_hand = arr_distinct_hands[loser_idx]
    const winner_hand = arr_distinct_hands[1-loser_idx]

    console.log(`Winner hand: ${winner_hand}`)
    console.log(`Loser  hand: ${loser_hand}`)

    const emojis = {0: ":fist:", 1: ":v:", 2: ":hand:"}

    const arr_round_result = hands.docs.map(hand => {
      const data = hand.data()
      return `- <@${hand.id}> ${emojis[data.hand]} ${ data.hand == winner_hand ? "(WIN)" : "" }`
    })

    const msg_round_result = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Round ${round+1}:\n${arr_round_result.join('\n')}`
          }
        }
      ]
    }

    const [channel_id, ts] = match_id.split('_')
    await client.chat.postMessage({
      channel: channel_id,
      thread_ts: ts,
      blocks: msg_round_result.blocks
    });

    round_status = {
      winner_hand: winner_hand,
      loser_hand: loser_hand,
      survivers: player_hands[winner_hand]
    }
    if (player_hands[winner_hand].length === 1) {
      const msg_match_result = {
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `Winner: <@${player_hands[winner_hand][0]}> :tada:`
            }
          }
        ]
      }

      await client.chat.postMessage({
        channel: channel_id,
        thread_ts: ts,
        reply_broadcast: true,
        blocks: msg_match_result.blocks
      });

      round_status.status = "one_win"
    } else {
      if (round >= 9) {
        const text_winners = player_hands[winner_hand].map(p_id => {
          return `<@${p_id}> `
        })

        const msg_match_result = {
          blocks: [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `10 rounds over!\nWinners: ${ text_winners } :tada:`
              }
            }
          ]
        }

        await client.chat.postMessage({
          channel: channel_id,
          thread_ts: ts,
          reply_broadcast: true,
          blocks: msg_match_result.blocks
        });
      } else {
        kick_next_round(matchesRef, client, match_id, round, player_hands[winner_hand])
      }
      round_status.status = "multi_win"
    }
  } else {
    const emojis = {0: ":fist:", 1: ":v:", 2: ":hand:"}

    const arr_round_result = hands.docs.map(hand => {
      const data = hand.data()
      return `- <@${hand.id}> ${emojis[data.hand]}`
    })

    const msg_round_result = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Round ${round+1}:\n${arr_round_result.join('\n')}`
          }
        }
      ]
    }

    const [channel_id, ts] = match_id.split('_')
    await client.chat.postMessage({
      channel: channel_id,
      thread_ts: ts,
      blocks: msg_round_result.blocks
    });

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
  if (current_round >= 9) { return }
  const [channel_id, ts] = match_id.split('_')
  const next_round = current_round + 1

  const text_players = player_ids.map(p_id => {
    return `<@${p_id}> `
  })

  const attach_round_n = [
    {
      color: "good",
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
