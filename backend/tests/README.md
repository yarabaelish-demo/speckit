# Integration Tests with Firebase Emulators

To run the integration tests, you need to have the Firebase Emulators running.

## 1. Start Firebase Emulators

Navigate to your project root directory and run the following command to start the Firebase Emulators:

```bash
firebase emulators:start --only firestore,storage,auth --project demo-project
```

Ensure the emulators are running on their default ports (Firestore: 8080, Storage: 9199, Auth: 9099). These ports are configured in `backend/src/config/firebaseAdmin.ts`.

## 2. Run the Tests

Once the emulators are running, navigate to the `backend` directory and run the tests using npm:

```bash
cd backend
NODE_ENV=test npm test
```

The `NODE_ENV=test` environment variable is crucial as it tells the application to connect to the Firebase emulators instead of the production Firebase project.
