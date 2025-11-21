# Data Model: Audio Blog with AI Therapist

## Entities

### User

- **userId**: string (unique identifier)
- **email**: string (unique)
- **createdAt**: timestamp

### AudioEntry

- **entryId**: string (unique identifier)
- **userId**: string (foreign key to User)
- **title**: string
- **audioUrl**: string (URL to the audio file in Firebase Storage)
- **tags**: array of strings
- **transcription**: string
- **aiResponse**: string
- **createdAt**: timestamp

### Tag

- **tagId**: string (unique identifier)
- **name**: string (unique)
