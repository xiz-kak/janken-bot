export function post_kickoff(say, kickoff_user_id) {
  const msg_kickoff = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `<@${ kickoff_user_id }> wants to play Janken!!\n<!here> Open thread to join!! :point_down:`
        }
      }
    ]
  }

  return say(msg_kickoff);
}

export function post_round_actions(client, channel_id, kickoff_ts, round, player_ids) {
  let pretext : string = ""
  if (round > 0) {
    let formatted_players : string = ""
    player_ids.forEach( p_id => { formatted_players += `<@${ p_id }> ` })

    pretext = `${ formatted_players } Hi, survivors!!\n`
  }

  const msg_attach_actions = [
    {
      color: "#f0ad4e",
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${ pretext }Pick your hand in *10 sec* to join...`
          }
        },
        {
          "type": "actions",
          "block_id": `${ channel_id }_${ kickoff_ts }-${ round }`,
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
    attachments: msg_attach_actions
  });
}

export function post_players(client, channel_id, kickoff_ts, player_ids) {
  let formatted_players : string = player_ids.length === 0 ? "(10 seats remaining...)" : ""
  player_ids.forEach( p_id => { formatted_players += `<@${ p_id }> :speech_balloon: \n` })

  const msg_players = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Players:`
        }
      }
    ],
    attachments: [
      {
        color: "#e5e5e5",
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `${ formatted_players }`
            }
          }
        ]
      }
    ]
  }

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    blocks: msg_players.blocks,
    attachments: msg_players.attachments
  });
}

export function update_players(client, channel_id, players_ts, survivor_ids, picked_player_ids) {
  let formatted_players : string = ""
  if (survivor_ids && survivor_ids.length > 0){ // round 1+
    survivor_ids.forEach(s_id => {
      const emoji = picked_player_ids.includes(s_id) ? ":white_check_mark:" : ":speech_balloon:"
      formatted_players += `<@${ s_id }> ${ emoji } \n`
    })
  } else { // round 0
    picked_player_ids.forEach(p_id => { formatted_players += `<@${ p_id }> :white_check_mark: \n` })
  }

  const msg_players = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Players:`
        }
      }
    ],
    attachments: [
      {
        color: "#e5e5e5",
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `${ formatted_players }`
            }
          }
        ]
      }
    ]
  }

  return client.chat.update({
    channel: channel_id,
    ts: players_ts,
    blocks: msg_players.blocks,
    attachments: msg_players.attachments
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

  return client.chat.update({
    channel: channel_id,
    ts: kickoff_ts,
    blocks: msg_kickoff_replace.blocks
  });
}

export function post_0_join_round(client, channel_id, kickoff_ts, round) {
  const msg_round_result = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `[Round ${ round + 1 }] No one joins :cry:`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:no_entry: Janken was cancelled`
        }
      }
    ]
  }

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    blocks: msg_round_result.blocks
  });
}

export function post_1_join_round(client, channel_id, kickoff_ts, round, winner_id) {
  const msg_round_result = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `[Round ${ round + 1 }] Only <@${ winner_id }> joins`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Final winner: <@${ winner_id }>* :tada:`
        }
      }
    ]
  }

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    blocks: msg_round_result.blocks
  });
}

export function post_round_result_win(client, channel_id, kickoff_ts, round, winner_hand, winner_ids) {
  const EMOJIS = {0: ":fist:", 1: ":v:", 2: ":hand:"}

  let formatted_winners : string = ""
  winner_ids.forEach( w_id => { formatted_winners += `<@${ w_id }> ` })

  const msg_round_result = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `[Round ${ round + 1 }] ${ EMOJIS[winner_hand] } *WON!!*`
        }
      }
    ],
    attachments: [
      {
        "color": "#5cb85c",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": formatted_winners
            }
          }
        ]
      }
    ]
  }

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    text: msg_round_result.blocks[0].text.text,
    blocks: msg_round_result.blocks,
    attachments: msg_round_result.attachments
  });
}

export function post_round_result_draw(client, channel_id, kickoff_ts, round) {
  const msg_round_result = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `[Round ${ round + 1 }] *DRAW*`
        }
      }
    ]
  }

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    text: msg_round_result.blocks[0].text.text,
    blocks: msg_round_result.blocks
  });
}

export function post_match_result_one_win(client, channel_id, kickoff_ts, winner_id) {
  const msg_match_result = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Final winner: <@${ winner_id }>* :tada:`
        }
      }
    ]
  }

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    text: msg_match_result.blocks[0].text.text,
    blocks: msg_match_result.blocks
  });
}

export function post_match_result_max_round(client, channel_id, kickoff_ts, winner_ids) {
  let formatted_winners : string = ""
  winner_ids.forEach( w_id => { formatted_winners += `<@${ w_id }> ` })

  const msg_match_result = {
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `10 rounds over!\n*Final winners: ${ formatted_winners }* :tada:`
        }
      }
    ]
  }

  return client.chat.postMessage({
    channel: channel_id,
    thread_ts: kickoff_ts,
    blocks: msg_match_result.blocks
  });
}
