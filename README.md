# Speckit Project Documentation

## Overview

This document provides a comprehensive overview of the Speckit project, an audio blogging platform with AI-powered therapeutic feedback. It details the project's architecture, setup instructions, and API usage.

## Backend

The backend is a Node.js/TypeScript application using Express.js. It handles user authentication, audio uploads, and interaction with Google Cloud services for transcription and AI analysis.

### Setup

1.  Navigate to the `backend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env` file and populate it with your Firebase project configuration.
4.  Run the development server: `npm run dev`

### Testing

The backend has three types of tests:

#### Unit and Integration Tests
```bash
cd backend
NODE_ENV=test npm test
```

**Prerequisites**: Firebase emulators must be running:
```bash
firebase emulators:start --only firestore,storage,auth --project demo-project
```

#### System Tests (Firebase AI Logic)
```bash
cd backend
export GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json
npm run test:ai
```

**Prerequisites**: 
- `FIREBASE_API_KEY` in `.env` file
- Service account key file (`serviceAccountKey.json`) in project root
- Firebase AI Logic or Gemini API enabled in your project

See `backend/tests/README.md` for detailed testing instructions.

### API Endpoints

-   `POST /api/auth/signup`: Register a new user.
-   `POST /api/auth/login`: Log in a user.
-   `POST /api/audio/upload`: Upload an audio file.
-   `GET /api/audio/search`: Search for audio entries.

## Frontend

The frontend is a React application that provides the user interface for interacting with the platform.

### Setup

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env` file and populate it with your Firebase project configuration.
4.  Run the development server: `npm start`

### Testing

```bash
cd frontend
npm test
```

Launches the test runner in interactive watch mode. See `frontend/README.md` for more details.

## Quick Start

### Development Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend  
npm install
npm start
```

### Running Tests
```bash
# Backend tests (requires Firebase emulators)
cd backend
firebase emulators:start --only firestore,storage,auth --project demo-project
NODE_ENV=test npm test

# Frontend tests
cd frontend
npm test

# System tests (Firebase AI Logic)
cd backend
export GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.json
npm run test:ai
```

## Deployment

The application is deployed using Firebase Hosting.
