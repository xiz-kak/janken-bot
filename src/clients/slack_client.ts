export function post_round_0_actions(client, channel_id, kickoff_ts,) {
  const msg_attach_round_0 = [
    {
      color: "#f0ad4e",
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
          "block_id": `${channel_id}_${kickoff_ts}-0`,
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

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    attachments: msg_attach_round_0
  });
}
