# Design Document: Firebase AI Logic Migration

## Overview

This design outlines the migration from Google Cloud Vertex AI SDK to Firebase AI Logic SDK for the backend AI services. The migration involves updating two service files to use the `@firebase/ai` package instead of `@google-cloud/vertexai`, while maintaining identical functionality and API contracts. The Firebase AI SDK provides a simpler, more integrated approach to accessing Gemini models within Firebase applications.

## Architecture

### Current Architecture (Vertex AI)
```
Service Layer (aiTherapistService.ts, transcriptionService.ts)
    ↓
@google-cloud/vertexai SDK
    ↓
Vertex AI API (Gemini models)
```

### New Architecture (Firebase AI Logic)
```
Service Layer (aiTherapistService.ts, transcriptionService.ts)
    ↓
@firebase/ai SDK
    ↓
Firebase AI Logic API (Gemini models)
```

### Key Differences

1. **Initialization**: Firebase AI uses `getGenerativeModel()` from the Firebase AI package with app initialization, while Vertex AI uses the VertexAI class with project/location configuration
2. **Authentication**: Firebase AI uses Firebase API keys, while Vertex AI uses Google Cloud service account credentials
3. **Model Access**: Both provide access to the same Gemini models (gemini-2.5-pro, gemini-1.5-flash)
4. **API Surface**: The generative model APIs are similar but have slight differences in initialization

## Components and Interfaces

### AI Therapist Service

**Current Interface (Vertex AI):**
```typescript
export const getAIResponse = async (transcription: string): Promise<string>
export const chatWithTherapist = async (
  history: { role: string, parts: { text: string }[] }[], 
  message: string
): Promise<string>
```

**New Implementation (Firebase AI):**
- Same function signatures
- Replace VertexAI initialization with Firebase AI initialization
- Use `getGenerativeModel()` from `@firebase/ai`
- Maintain system instructions and prompt structure

### Transcription Service

**Current Interface (Vertex AI):**
```typescript
export const transcribeAudio = async (gcsUri: string): Promise<string>
```

**New Implementation (Firebase AI):**
- Same function signature
- Replace VertexAI initialization with Firebase AI initialization
- Maintain GCS file download and base64 encoding logic
- Preserve MIME type detection logic
- Keep the same prompt and content structure

## Data Models

No changes to data models are required. The services maintain the same input/output contracts:

- **getAIResponse**: Input: `string` (transcription), Output: `string` (AI response)
- **chatWithTherapist**: Input: `history` array and `message` string, Output: `string` (chat response)
- **transcribeAudio**: Input: `string` (GCS URI), Output: `string` (transcription)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Contract Preservation
*For any* valid input to the migrated services, the function signatures, parameter types, and return types should remain identical to the Vertex AI implementation
**Validates: Requirements 1.3**

### Property 2: Response Format Consistency
*For any* transcription input to getAIResponse, the returned string format should match the format returned by the Vertex AI implementation
**Validates: Requirements 2.1**

### Property 3: Chat History Compatibility
*For any* chat history array passed to chatWithTherapist, the history format should be compatible with both the old Vertex AI and new Firebase AI implementations
**Validates: Requirements 2.2**

### Property 4: Error Handling Equivalence
*For any* error condition in either service, the error messages and handling behavior should match the Vertex AI implementation
**Validates: Requirements 2.4**

### Property 5: Transcription Output Consistency
*For any* valid GCS URI input to transcribeAudio, the transcription output format should match the Vertex AI implementation
**Validates: Requirements 2.3**

## Error Handling

The migration will preserve all existing error handling:

1. **AI Therapist Service**:
   - Catch errors during content generation and return fallback message
   - Handle missing response candidates gracefully
   - Log errors for debugging

2. **Transcription Service**:
   - Validate GCS URI format
   - Handle file download errors
   - Catch transcription API errors
   - Log errors with context

## Testing Strategy

### Unit Tests
- Verify that mocked Firebase AI services return expected responses
- Test error handling paths
- Validate that function signatures remain unchanged

### Integration Tests
- Ensure mocked AI services integrate correctly with the audio service
- Verify that the upload and retrieval flow works with mocked Firebase AI
- Confirm that mock interfaces remain compatible

### System Tests
- Test real transcription with actual audio files using Firebase AI Logic
- Verify authentication with Firebase API keys
- Confirm that real API calls produce valid transcriptions
- Validate GCS file upload and download with Firebase AI
- **Implementation Note**: Created `test-ai-service.cjs` as a Node.js-based system test due to Jest ES module configuration complexities

### Property-Based Testing
This migration focuses on preserving existing behavior rather than introducing new logic, so property-based testing is not required. The existing unit, integration, and system tests provide sufficient coverage to verify that the migration maintains functional equivalence.

### Testing Framework
- **Unit/Integration Tests**: Jest with mocking
- **System Tests**: Node.js script (`tests/system/test-ai-service.cjs`) with real Firebase AI API calls
- **Test Configuration**: Minimum 100 iterations for any property-based tests (if added in future)

### Test Tagging
- System tests will be tagged with comments indicating they test real Firebase AI Logic integration
- Mock-based tests will clearly indicate they use mocked Firebase AI services

## Implementation Notes

### Firebase AI Initialization
```typescript
import { getAI, getGenerativeModel } from '@firebase/ai';
import { initializeApp } from 'firebase/app';
import { GoogleGenerativeAI } from '@google/generative-ai';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
};

// Lazy initialization with fallback mechanism
const getModel = () => {
  try {
    const app = initializeApp(firebaseConfig, 'service-name');
    const ai = getAI(app);
    return getGenerativeModel(ai, { model: 'gemini-1.5-flash' });
  } catch (error) {
    // Fallback to direct Gemini API if Firebase AI Logic is not available
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    throw new Error('Neither Firebase AI nor Gemini API key is available');
  }
};
```

### Environment Variables
- `FIREBASE_API_KEY`: Required for Firebase AI authentication
- `GCLOUD_PROJECT`: Project ID (may still be needed for GCS operations)
- `GOOGLE_APPLICATION_CREDENTIALS`: Service account for GCS access

### Dependencies
- Keep: `@firebase/ai` (already installed)
- Keep: `firebase-admin` (for GCS operations)
- Added: `@google/generative-ai` (for fallback when Firebase AI Logic is not available)
- Remove from imports: `@google-cloud/vertexai`
- Note: `@google-cloud/vertexai` can remain in package.json for now to avoid breaking other potential dependencies

## Implementation Decisions

### Fallback Mechanism
During implementation, we discovered that Firebase AI Logic may not be immediately available in all projects. To ensure robustness, we implemented a fallback mechanism:

1. **Primary**: Attempt to use Firebase AI Logic via `@firebase/ai`
2. **Fallback**: If Firebase AI Logic is unavailable, fall back to direct Gemini API via `@google/generative-ai`
3. **Error Handling**: Provide clear error messages distinguishing between configuration issues and code issues

### System Testing Approach
The original design called for Jest-based system tests, but during implementation we encountered ES module configuration complexities. We solved this by:

1. **Created Node.js-based system test**: `tests/system/test-ai-service.cjs`
2. **Added npm script**: `npm run test:ai` for easy execution
3. **Enhanced error reporting**: Clear distinction between configuration and code issues
4. **Removed non-functional Jest test**: Cleaned up `transcriptionSystem.test.ts` that couldn't run due to ES module issues

### Configuration Requirements
The implementation revealed specific configuration requirements:

1. **Firebase AI Logic**: Must be enabled in Firebase Console (may not be available by default)
2. **Gemini API**: Requires Generative Language API to be enabled in Google Cloud Console
3. **Service Account**: Still needed for GCS operations regardless of AI service used

## Migration Steps

1. Create feature branch
2. Update aiTherapistService.ts to use Firebase AI
3. Update transcriptionService.ts to use Firebase AI with fallback mechanism
4. Run and fix unit tests
5. Run and fix integration tests
6. Create and run Node.js-based system tests
7. Verify all tests pass
8. Clean up non-functional test files
9. Update documentation
10. Commit changes to feature branch
