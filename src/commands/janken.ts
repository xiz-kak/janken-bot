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
            "text": `<@${command.user_id}> wants to janken with <!here>`
          },
          "accessory": {
            "type": "image",
            "image_url": `https://tenor.com/view/counter10-countdown-numbers-circles-gif-16733673?${ Date.now() }`,
            "alt_text": "10 sec"
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
              "text": "Pick your hand!"
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
                "value": "2",
                "action_id": "pick_2"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": ":hand:",
                  "emoji": true
                },
                "value": "5",
                "action_id": "pick_5"
              }
            ]
          }
        ]
      }
    ]

    const matchesRef = firestore.collection('matches')
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

    setTimeout(() => {
      client.chat.update({
        channel: res_kickoff.channel,
        ts: res_kickoff.ts,
        blocks: [{"type": "section", "text": {"type": "mrkdwn", "text": `Janken match started by <@${command.user_id}>`}}]
      });
      client.chat.delete({
        channel: res_round_0.channel,
        ts: res_round_0.ts
      });
    },11000);
  }
}
