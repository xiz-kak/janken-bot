import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firestore'
import { judge_round } from '../game_utils/judge_round'
import * as SlackClient from '../clients/slack_client'

export default function() {
  app.command('/janken', async (args) => { janken(args) })
  app.command('/janken_dev', async (args) => { janken(args) })

  const janken = async ({ command, ack, say, client, context, respond }) => {
    await ack();

    try {
      const res_kickoff = await SlackClient.post_kickoff(
        say,
        command.user_id
      )

      const res_round_0 = await SlackClient.post_round_actions(
        client,
        res_kickoff.channel,
        res_kickoff.ts,
        0,
        null
      )

      const res_players = await SlackClient.post_players(
        client,
        res_kickoff.channel,
        res_kickoff.ts,
        []
      )

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

      await matchesRef
        .doc(match_id)
        .collection('rounds')
        .doc('0')
        .set({players_ts: res_players.ts})

      setTimeout(async () => {
        await client.chat.delete({
          channel: res_round_0.channel,
          ts: res_round_0.ts
        });

        await client.chat.delete({
          channel: res_players.channel,
          ts: res_players.ts
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
    } catch (e) {
      console.error(e)
      if (e.data && e.data.error == "channel_not_found") {
        respond({
          response_type: "ephemeral",
          text: `Sorry, seems I'm not in this channel. Please *invite me here* to play :v:`
        });
      } else {
        respond({
          response_type: "ephemeral",
          text: `Sorry, something went wrong... Please run again :cry:`
        });
      }
    }
  }
}
