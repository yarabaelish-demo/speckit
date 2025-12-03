# Integration Tests with Firebase Emulators

To run the integration tests, you need to have the Firebase Emulators running.

## 1. Start Firebase Emulators

Navigate to your project root directory and run the following command to start the Firebase Emulators:

```bash
firebase emulators:start --only firestore,storage,auth --project demo-project
```

Ensure the emulators are running on their default ports (Firestore: 8080, Storage: 9199, Auth: 9099). The test environment uses these default ports, which are configured via `backend/tests/setupEnv.js` for the test run.

## 3. Test Environment Setup (`setupEnv.js`)

To ensure integration tests connect to the Firebase Emulators, the `backend/tests/setupEnv.js` file sets the necessary environment variables:

-   `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
-   `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`
-   `STORAGE_EMULATOR_HOST=http://127.0.0.1:9199`
    *   **Note:** The `http://` prefix is strictly required for Storage. The Cloud Storage client defaults to HTTPS if no protocol is specified, which causes connection errors with the local emulator (SSL protocol mismatch). Firestore and Auth clients automatically handle plaintext connections when their respective emulator variables are set, so they do not need the prefix.
-   `GCLOUD_PROJECT=demo-project`

This file is automatically loaded by Jest via `jest.config.cjs` before tests execute, directing the Firebase Admin SDK to communicate with the local emulators.

## 2. Run the Unit and Integration Tests

Once the emulators are running, navigate to the `backend` directory and run the tests using npm:

```bash
cd backend
NODE_ENV=test npm test
```

The `NODE_ENV=test` environment variable is crucial as it tells the application to connect to the Firebase emulators instead of the production Firebase project.

## 3. Run the System Test

Place GEMINI_API_KEY with Firebase AI Logic access in `.env`. You can restrict this key to only Firebase AI Logic. 

```bash
cd backend
 NODE_ENV=system NODE_OPTIONS='--experimental-vm-modules' npx jest tests/system/transcriptionSystem.test.ts
```

To make this warning message - "`GOOGLE_APPLICATION_CREDENTIALS` not set. System test may fail." - go away, also set `GOOGLE_APPLICATION_CREDENTIALS`. This key is supposed to have storage access. 
