---
description: "Task list for implementing the Audio Blog with AI Therapist feature."
---

# Tasks: Audio Blog with AI Therapist

**Input**: Design documents from `/specs/001-audio-blog-therapist/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization to ensure a runnable state, especially for the frontend.

- [X] T001 [P] Initialize backend Node.js/TypeScript project in `backend/` and install dependencies (express, firebase-admin, etc.) from `backend/package.json`.
- [X] T002 [P] Initialize frontend React project in `frontend/` and install dependencies (react, firebase, etc.) from `frontend/package.json`.
- [X] T003 [P] Create basic file structure in `backend/src/` (`api`, `services`, `models`, `config`, `middleware`).
- [X] T004 [P] Create basic file structure in `frontend/src/` (`components`, `pages`) to satisfy imports and allow `npm start` to run without errors.
- [X] T005 Create a placeholder `App.tsx` in `frontend/src/` that renders a simple "Hello World" to ensure the dev server can start.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [X] T006 Configure Firebase Admin SDK initialization in `backend/src/config/firebaseAdmin.ts`.
- [X] T007 [P] Set up the basic Express server in `backend/src/index.ts` and `backend/src/app.ts`.
- [X] T008 [P] Configure Firebase for the frontend application in `frontend/src/firebaseConfig.ts`.
- [X] T009 Implement a simple logger middleware in `backend/src/middleware/logger.ts`.
- [X] T010 [P] Create a generic `Header.tsx` component in `frontend/src/components/Header.tsx` for basic navigation.

---

## Phase 3: User Story 1 - Account Management (Priority: P1) 🎯 MVP

**Goal**: As a user, I want to be able to create an account and log in, so that I can access my personal audio blog.
**Independent Test**: A new user can register through the UI, and then log in successfully, gaining access to a placeholder dashboard page.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create the User data model in `backend/src/models/user.ts` based on `data-model.md`.
- [X] T012 [US1] Implement signup and login endpoints using Firebase Authentication in `backend/src/api/auth.ts`.
- [X] T013 [P] [US1] Create the main authentication page in `frontend/src/pages/Auth.tsx`.
- [X] T014 [P] [US1] Create the `SignUpForm.tsx` component in `frontend/src/components/SignUpForm.tsx`.
- [X] T015 [P] [US1] Create the `LoginForm.tsx` component in `frontend/src/components/LoginForm.tsx`.
- [X] T016 [US1] Implement frontend logic in the components to call the `/auth/signup` and `/auth/login` backend APIs.

---

## Phase 4: User Story 2 - Audio Upload and Tagging (Priority: P1)

**Goal**: As a user, I want to be able to upload audio files and add tags to them, so that I can organize my audio entries.
**Independent Test**: A logged-in user can upload an MP3 file, add tags, and see a representation of the entry on their dashboard.

### Implementation for User Story 2

- [X] T017 [P] [US2] Create the AudioEntry data model in `backend/src/models/audioEntry.ts`.
- [X] T018 [US2] Implement the `/audio/upload` endpoint in `backend/src/api/audio.ts`. This will handle file uploads to Firebase Storage and create an AudioEntry document in Firestore.
- [X] T019 [P] [US2] Create the main `Dashboard.tsx` page in `frontend/src/pages/Dashboard.tsx` to display audio entries.
- [X] T020 [P] [US2] Create the `Upload.tsx` page/component in `frontend/src/pages/Upload.tsx` with a file input for audio and a text input for tags.
- [X] T021 [US2] Implement the frontend logic to upload the audio file and metadata to the backend.

---

## Phase 5: User Story 3 - Audio Transcription and Search (Priority: P2)

**Goal**: As a user, I want my uploaded audio to be transcribed automatically, so that the content is searchable.
**Independent Test**: After an audio file is uploaded, its transcription appears. A user can find the entry by searching for a word from the transcription.

### Implementation for User Story 3

- [X] T022 [US3] Create a `transcriptionService.ts` in `backend/src/services/` to handle audio transcription (can be a mock initially). This should be triggered as a background process on audio upload.
- [X] T023 [US3] Implement the `/audio/search` endpoint in `backend/src/api/audio.ts` to query Firestore based on transcription content.
- [X] T024 [P] [US3] Create a `SearchBar.tsx` component in `frontend/src/components/SearchBar.tsx`.
- [X] T025 [US3] Integrate the search bar into `Dashboard.tsx` and implement the logic to call the search API and display results.
- [X] T026 [US3] Update the dashboard to display the transcription for each audio entry.

---

## Phase 6: User Story 4 - AI Therapist Response (Priority: P2)

**Goal**: As a user, I want to receive a response from an AI that acts like a therapist based on the content of my audio.
**Independent Test**: After an audio file is transcribed, an AI-generated text response is displayed with the audio entry.

### Implementation for User Story 4

- [X] T027 [US4] Create an `aiTherapistService.ts` in `backend/src/services/` to generate a therapeutic response from text (can be a mock initially). This should be triggered after transcription is complete.
- [X] T028 [US4] Update the backend logic to save the AI response to the AudioEntry document in Firestore.
- [X] T029 [US4] Update the `Dashboard.tsx` page in `frontend/src/` to display the AI-generated response for each audio entry.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [X] T030 [P] Refine UI/UX and styling across the application in `frontend/src/App.css` and `frontend/src/index.css`.
- [X] T031 Implement comprehensive error handling for all API interactions on the frontend.
- [X] T032 Code cleanup and refactoring across both `frontend` and `backend`.
- [ ] T033 Validate the final application against the steps in `specs/001-audio-blog-therapist/quickstart.md`.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** must be complete before **Foundational (Phase 2)**.
- **Foundational (Phase 2)** must be complete before any User Story phases can begin.
- **User Stories (Phase 3-6)** depend on Phase 2. US1 and US2 are P1 and should be prioritized.
- **User Story Dependencies**:
  - US2 (Upload) depends on US1 (Auth).
  - US3 (Transcription/Search) depends on US2 (Upload).
  - US4 (AI Response) depends on US3 (Transcription).

## Implementation Strategy

1.  **MVP First**: Complete Phase 1, 2, 3, and 4 to deliver the core functionality of auth and audio upload.
2.  **Incremental Delivery**: Add Phase 5 (Transcription/Search), then Phase 6 (AI Response), and finally Phase 7 (Polish). Each phase adds a testable layer of functionality.
