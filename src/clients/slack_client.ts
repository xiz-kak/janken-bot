export function post_kickoff(say, kickoff_user_id) {
  const msg_kickoff = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `<@${ kickoff_user_id }> wants to play Janken!!\nOpen thread to join!! :point_down:`
        }
      }
    ]
  }

  return say(msg_kickoff);
}

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

export function update_kickoff(client, channel_id, kickoff_ts, kickoff_user_id, player_ids) {
  let text_players : string

  if (player_ids.length === 0) {
    text_players = "- No one joined :cry:"
  } else if (player_ids.length === 1) {
    text_players = `- Only <@${ player_ids[0] }> joined.\nJanken was not started :cry: (2+ players are needed)`
  } else {
    text_players = player_ids.map(p_id => { return `- <@${ p_id }> joined`}).join('\n')
  }

  const msg_kickoff_replace = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `<@${ kickoff_user_id }> challenged to play Janken!!\n${ text_players }`
        }
      }
    ]
  }

  client.chat.update({
    channel: channel_id,
    ts: kickoff_ts,
    blocks: msg_kickoff_replace.blocks
  });
}
