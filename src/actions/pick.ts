import { app } from '../initializers/bolt'

export default function() {
  app.action(/^pick_.*/, async ({ body, action, ack, say }) => {
    await ack();
    await say(`<@${ body.user.id }> picked ${ action.text.text }`);
  });

}
