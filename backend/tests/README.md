# Backend Testing Guide

This guide covers all types of tests in the backend: unit tests, integration tests, and system tests.

## Prerequisites

### For Unit and Integration Tests

Navigate to your project root directory and start the Firebase Emulators:

```bash
firebase emulators:start --only firestore,storage,auth --project demo-project
```

Ensure the emulators are running on their default ports (Firestore: 8080, Storage: 9199, Auth: 9099).

### For System Tests

Set up the following environment variables:
- `FIREBASE_API_KEY` - Firebase API key with AI Logic access (in `.env` file)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key for GCS access

```bash
export GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json
```

## Test Environment Setup (`setupEnv.js`)

To ensure integration tests connect to the Firebase Emulators, the `backend/tests/setupEnv.js` file sets the necessary environment variables:

-   `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
-   `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`
-   `STORAGE_EMULATOR_HOST=http://127.0.0.1:9199`
    *   **Note:** The `http://` prefix is strictly required for Storage. The Cloud Storage client defaults to HTTPS if no protocol is specified, which causes connection errors with the local emulator (SSL protocol mismatch). Firestore and Auth clients automatically handle plaintext connections when their respective emulator variables are set, so they do not need the prefix.
-   `GCLOUD_PROJECT=demo-project`

This file is automatically loaded by Jest via `jest.config.cjs` before tests execute, directing the Firebase Admin SDK to communicate with the local emulators.

## Running Tests

### 1. Unit and Integration Tests

Once the emulators are running, navigate to the `backend` directory and run the tests using npm:

```bash
cd backend
NODE_ENV=test npm test
```

The `NODE_ENV=test` environment variable is crucial as it tells the application to connect to the Firebase emulators instead of the production Firebase project.

### 2. System Tests

The system test verifies Firebase AI Logic integration with real services.

Set up environment variables:
- `FIREBASE_API_KEY` - Firebase API key with AI Logic access
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key for GCS access

```bash
cd backend
export GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json
npm run test:ai
```

This test will show whether Firebase AI Logic or Gemini API is being used and verify the transcription service works correctly.

## Available Scripts

- `npm test` - Run unit and integration tests (excludes system tests)
- `npm run test:ai` - Run system tests for Firebase AI Logic integration
- `npm run build` - Compile TypeScript to JavaScript (required before running system tests)
- `npm run dev` - Start development server with hot reload

## Test Coverage

### Unit Tests (`tests/unit/`)
- **aiTherapistService.test.ts**: Tests AI response generation with mocked services
- Tests individual service functions in isolation

### Integration Tests (`tests/integration/`)
- **audio.test.ts**: Tests audio upload and retrieval workflows with Firebase emulators
- **search.test.ts**: Tests search functionality with mocked data
- Tests component interactions using Firebase emulators

### System Tests (`tests/system/`)
- **test-ai-service.cjs**: Tests real Firebase AI Logic/Gemini API integration
- Tests end-to-end functionality with real external services
- Verifies GCS upload/download and AI transcription

## Troubleshooting

### Common Issues

1. **Emulator Connection Errors**: Ensure Firebase emulators are running before running unit/integration tests
2. **System Test Failures**: Check that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account key
3. **Firebase AI Errors**: Verify Firebase AI Logic is enabled in your Firebase project, or ensure Gemini API is enabled in Google Cloud Console
4. **Permission Errors**: Ensure your service account has Storage Admin permissions for GCS operations

### Expected System Test Outcomes

- ✅ **Success**: Firebase AI Logic is enabled and working
- ⚠️ **Configuration Issue**: Firebase AI Logic not enabled, falls back to Gemini API (may be blocked)
- ❌ **Failure**: Code issue that needs investigation 
