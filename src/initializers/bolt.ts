const { App, ExpressReceiver } = require(`@slack/bolt`)
const { LogLevel } = require(`@slack/logger`)
import { firestore } from './firestore'
import { encrypt, decrypt } from '../utils/secure'

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: `/slack/events`,
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
})

const logLevel = process.env.SLACK_LOG_LEVEL || LogLevel.INFO

const installationsRef = firestore.collection(`installations`)

const config = {
  logLevel,
  receiver
}

export const app = new App(config)
