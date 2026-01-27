# Requirements Document

## Introduction

This feature involves migrating the backend AI services from Google Cloud Vertex AI to Firebase AI Logic. The migration will update two service files (aiTherapistService.ts and transcriptionService.ts) to use the Firebase AI SDK instead of the Vertex AI SDK, while maintaining the same functionality and API contracts. All existing tests will be updated to work with the new implementation.

## Glossary

- **Firebase AI Logic**: Firebase's AI service that provides access to Gemini models through the Firebase SDK
- **Vertex AI**: Google Cloud's AI platform for accessing Gemini models through the Vertex AI SDK
- **AI Therapist Service**: Backend service that generates therapeutic responses to user journal entries
- **Transcription Service**: Backend service that transcribes audio files to text
- **GCS**: Google Cloud Storage, used for storing audio files
- **System**: The backend application services

## Requirements

### Requirement 1

**User Story:** As a developer, I want to migrate from Vertex AI to Firebase AI Logic, so that I can use Firebase's integrated AI capabilities instead of separate Google Cloud services.

#### Acceptance Criteria

1. WHEN the AI Therapist Service generates a response THEN the System SHALL use the Firebase AI SDK instead of the Vertex AI SDK
2. WHEN the Transcription Service transcribes audio THEN the System SHALL use the Firebase AI SDK instead of the Vertex AI SDK
3. WHEN either service is called THEN the System SHALL maintain the same function signatures and return types as the current implementation
4. WHEN the migration is complete THEN the System SHALL remove all Vertex AI SDK imports and dependencies from the service files
5. WHEN the Firebase AI SDK is initialized THEN the System SHALL use the appropriate Firebase configuration and API keys

### Requirement 2

**User Story:** As a developer, I want to preserve existing functionality, so that the migration does not break any current features or user experiences.

#### Acceptance Criteria

1. WHEN the AI Therapist Service receives a transcription THEN the System SHALL return a therapeutic response with the same format as before
2. WHEN the AI Therapist Service handles chat conversations THEN the System SHALL maintain conversation history in the same format
3. WHEN the Transcription Service receives a GCS URI THEN the System SHALL download, process, and transcribe the audio file as before
4. WHEN either service encounters an error THEN the System SHALL handle errors gracefully with the same error messages as before
5. WHEN the services use system instructions or prompts THEN the System SHALL preserve the exact same instructions and prompts

### Requirement 3

**User Story:** As a developer, I want all tests to pass after migration, so that I can verify the migration was successful and functionality is preserved.

#### Acceptance Criteria

1. WHEN unit tests are executed THEN the System SHALL pass all existing unit tests for the AI services
2. WHEN integration tests are executed THEN the System SHALL pass all existing integration tests that use mocked AI services
3. WHEN system tests are executed THEN the System SHALL successfully transcribe real audio files using Firebase AI Logic
4. WHEN tests use mocked services THEN the System SHALL maintain the same mock interfaces and return values
5. WHEN the test environment is configured THEN the System SHALL use appropriate Firebase credentials and configuration

### Requirement 4

**User Story:** As a developer, I want to implement this migration in a feature branch, so that I can test changes before merging to the main branch.

#### Acceptance Criteria

1. WHEN starting the migration THEN the System SHALL create a new Git branch for the feature
2. WHEN making changes THEN the System SHALL commit all changes to the feature branch
3. WHEN the migration is complete THEN the System SHALL have all changes ready for review in the feature branch
4. WHEN the feature branch is created THEN the System SHALL use a descriptive branch name that indicates the migration purpose
