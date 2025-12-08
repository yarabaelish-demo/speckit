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

## Deployment

The application is deployed using Firebase Hosting.
