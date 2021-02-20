import { app } from '../initializers/bolt'

const enableRedirectInstall = () => {
  app.receiver.app.get(`/slack/redirect_install`, async (req, res) => {

    try {
      const url = await app.receiver.installer?.generateInstallUrl({
        scopes: [
          'chat:write',
          'chat:write.public',
          'commands'
        ],
        userScopes: [],
      });

      res.redirect(url);
    } catch (error) {
      console.log(error);
    }
  })
}

export { enableRedirectInstall }
