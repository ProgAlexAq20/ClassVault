Deploying the webhook as a Firebase Cloud Function

1. Install Firebase CLI and login:

```bash
npm install -g firebase-tools
firebase login
```

2. Select your Firebase project (or create one) and deploy:

```bash
firebase use --add <your-firebase-project-id>
cd functions
npm install
cd ..
firebase deploy --only functions:pixWebhook --project <your-firebase-project-id>
```

Notes:
- When deployed in the same Firebase project, `firebase-admin` will use the default service account and you do not need to set `FIREBASE_SERVICE_ACCOUNT_JSON`.
- If deploying elsewhere, set the environment variable `FIREBASE_SERVICE_ACCOUNT_JSON` with the service account JSON (securely). Example for local testing:

```bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'
```

- Secure the webhook endpoint by validating provider signatures and/or using an allowlist of sender IPs.
