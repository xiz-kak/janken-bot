# janken-bot for Slack

![Deploy to Google App Engine](https://github.com/xiz-kak/janken-bot/workflows/Deploy%20to%20Google%20App%20Engine/badge.svg)

This application demopnstrates the implementation of Slack app to play Janken game (paper-scissors-rock).

## Tech stack

- Runtime: Node.js
- Framework: [Bolt](https://slack.dev/bolt-js/tutorial/getting-started) - Slack's official chat app framework
- Database: Firestore
- Infrastructure: Google App Engine
- CI/CD: GitHub Actions

## Setup local env

### Prerequisites

- Slack app is created
- GCP project is created

### Configure the environment variables

```
$ cp .env.sample .env
$ vi .env
```

Set the following variables.

|Key|Value|
|---|---|
|SLACK_SIGNING_SECRET|Slack app web console > Basic Information > App Credentials > Signing Secret|
|SLACK_CLIENT_ID|Slack app web console > Basic Information > App Credentials > Client ID|
|SLACK_CLIENT_SECRET|Slack app web console > Basic Information > App Credentials > Client Secret|
|SLACK_STATE_SECRET|This can be a random string.<br/>This is used in the OAuth flow.|
|ENCRYPTION_KEY|This can be a random string of **32 Bytes**.<br/>This is used in encrypt/decrypt tokens.|
|BUFFER_KEY|This can be a random string of **16 Bytes**.<br/>This is used in encrypt/decrypt tokens.|

### Add the Service Account Key of GCP to access Firestore

Obtain a service account key from the GCP console.

[IAM & Admin > Service Accounts](https://console.cloud.google.com/projectselector2/iam-admin/serviceaccounts) > Select project > Service account of `firebase-adminsdk` > Actions > Create key

Rename the file to `service_account_key-firebase-adminsdk.json` and place it in the `credentials` directory.

### Install package dependencies

```
$ npm install
```

### Start local env

```
$ npm run dev
```

You will get the public URL of your local app.

### Set the URLs in the Slack app settings in the web console

#### OAuth & Permissions

OAuth & Permissions > Redirect URLs > Add New Redirect URL

URL: (Your ngrok URL)/slack/oauth_redirect

#### Event Subscriptions

Event Subscriptions > Enable Events > Request URL

URL: (Your ngrok URL)/slack/events

#### Slash Commands

Slash Commands > Create New Command

Command: `/janken_dev`  
Request URL: (Your ngrok URL)/slack/events  
Escape channels, users, and links sent to your app: On

#### Interactivity & Shortcuts

Interactivity & Shortcuts > Interactivity > Request URL

URL: (Your ngrok URL)/slack/events  
