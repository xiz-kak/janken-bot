import { app } from '../initializers/bolt'

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

    const attach_round_1 = [
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
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": ":fist:",
                  "emoji": true
                },
                "value": "click_me_123",
                "action_id": "pick_fist"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": ":v:",
                  "emoji": true
                },
                "value": "click_me_123",
                "action_id": "pick_v"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": ":hand:",
                  "emoji": true
                },
                "value": "click_me_123",
                "action_id": "pick_hand"
              }
            ]
          }
        ]
      }
    ]

    const res_round_1 = await client.chat.postMessage({
      channel: res_kickoff.channel,
      attachments: attach_round_1
    });

    console.log(res_kickoff)
    console.log(res_round_1)

    setTimeout(() => {
      client.chat.update({
        channel: res_kickoff.channel,
        ts: res_kickoff.ts,
        blocks: [{"type": "section", "text": {"type": "mrkdwn", "text": `Janken round started by <@${command.user_id}>`}}]
      });
      client.chat.delete({
        channel: res_round_1.channel,
        ts: res_round_1.ts
      });
    },11000);
  }
}
