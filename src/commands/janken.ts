import { app } from '../initializers/bolt'

export default function() {
  // app.command('/echo', async (args) => { echo(args) })
  // app.command('/echo_dev', async (args) => { echo(args) })

  // const echo = ({ command, ack, say }) => {
  //   ack()

  //   say(`発言：${command.text}`)
  // }


  app.command('/janken', async (args) => { janken(args) })
  app.command('/janken_dev', async (args) => { janken(args) })

  const janken = async ({ command, ack, say, client, context }) => {
    ack();

    const message = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `<@${command.user_id}> challenges ${command.text}`
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
      ],
      text: `Message cannot be displayed correctly... Update your slack.`
    };
    await say(message);
    const message_10_sec = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Remaining..."
          },
          "accessory": {
            "type": "image",
            "image_url": `https://tenor.com/view/counter10-countdown-numbers-circles-gif-16733673?${ Date.now() }`,
            "alt_text": "10 sec"
          }
        }
      ]
    }
    const res = await say(message_10_sec);
    console.log(res)
    setTimeout(() => {
      client.chat.update({
        channel: res.channel,
        ts: res.ts,
        blocks: [{"type": "section", "text": {"type": "plain_text", "text": "Hello world"}}]
      });
    },11000);
  }
}
