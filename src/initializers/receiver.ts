const { ExpressReceiver } = require(`@slack/bolt`)
import { firestore } from './firestore'
import { encrypt, decrypt } from '../utils/secure'

let config: { [key: string]: any } = {
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: `/slack/events`
}

if (process.env.SLACK_OAUTH_ENABLED === '1') {
  const installationsRef = firestore.collection(`installations`)

  config = {
    ...config,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: process.env.SLACK_STATE_SECRET,
    scopes: [
      'chat:write',
      'chat:write.public',
      'commands'
    ],
    installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall) {
          return await installationsRef
            .doc(installation.enterprise.id)
            .set({installation: encrypt(JSON.stringify(installation))})
        } else {
          return await installationsRef
            .doc(installation.team.id)
            .set({installation: encrypt(JSON.stringify(installation))})
        }
        throw new Error('Failed saving installation data to installationStore');
      },
      fetchInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
          const installationDoc = await installationsRef
            .doc(installQuery.enterpriseId)
            .get()
          const installationObj = installationDoc.data() as { installation: string }
          return JSON.parse(decrypt(installationObj.installation))
        }
        if (installQuery.teamId !== undefined) {
          const installationDoc = await installationsRef
            .doc(installQuery.teamId)
            .get()
          const installationObj = installationDoc.data() as { installation: string }
          return JSON.parse(decrypt(installationObj.installation))
        }
        throw new Error('Failed fetching installation');
      },
    },
  }
}

export const receiver = new ExpressReceiver(config)
