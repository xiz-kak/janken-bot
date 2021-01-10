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
      kickoff_ts: res_kickoff.ts
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
      client.chat.delete({
        channel: res_round_0.channel,
        ts: res_round_0.ts
      });

      const players = await matchesRef
        .doc(match_id)
        .collection('players')
        .get()

      const arr_players = players.docs.map(p => {
        return `- <@${p.id}> joined`
      })

      const text_players = arr_players.length === 0 ? "- No one joined :cry:" : arr_players.join('\n')

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

      if (arr_players.length === 1) {
        // TODO if length === 1
        client.chat.postMessage({
          channel: res_kickoff.channel,
          thread_ts: res_kickoff.ts,
          text: "You won!! :tada:"
        });
      } else if (arr_players.length > 1) {
        judge_round(matchesRef, client, match_id, 0)
      }

    },11000);
  }
}

const judge_round = async (matchesRef, client, match_id, round) => {
  // TODO: Start second round
  //   - get hands in the round -> DONE
  //   - calculate winner or draw -> DONE
  //   - post the result in thread -> DONE
  //   - save the round result -> DONE
  //   - if draw
  //     -> post ephemeral to survivers
  //   - if one_win or 10 rounds over
  //     -> post match result

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
    // player_hands[`hand_${data.hand}`].push(hand.id)
    player_hands[data.hand].push(hand.id)
    arr_hands.push(Number(data.hand))
  })

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
    client.chat.postMessage({
      channel: channel_id,
      thread_ts: ts,
      blocks: msg_round_result.blocks
    });

    round_status = {
      winner_hand: winner_hand,
      loser_hand: loser_hand
    }
    if (player_hands[winner_hand].length === 1) {
      // TODO close match
      round_status.status = "one_win"
    } else {
      // TODO move next round
      round_status.status = "multi_win"
    }
  } else {
    console.log("DRAW")
    // TODO move next round
    round_status.status = "draw"
  }

  await matchesRef
    .doc(match_id)
    .collection('rounds')
    .doc(String(round))
    .set(round_status)
}
