# Requirements Document

## Introduction

This document specifies the requirements for redesigning the frontend user interface of the audio blog therapist application. The redesign focuses on improving the layout and user experience by relocating the search functionality to the header, implementing a two-panel layout with a calendar on the left and blog entries on the right, and adding pagination for blog entries. The redesign aims to create a more intuitive and organized interface for users to browse and search their audio journal entries.

## Glossary

- **Application**: The audio blog therapist web application
- **User**: An authenticated person using the Application
- **Header**: The top navigation bar of the Application
- **SearchBar**: A UI component that accepts text input for searching entries
- **Dashboard**: The main page displaying the User's audio journal entries
- **BlogEntry**: An audio journal entry containing transcription, audio, tags, and AI response
- **Calendar**: A visual date picker component showing dates with entries
- **LeftPanel**: The left side of the Dashboard displaying the Calendar
- **RightPanel**: The right side of the Dashboard displaying BlogEntries
- **SearchResults**: A filtered list of BlogEntries matching the search query
- **Pagination**: Navigation controls allowing Users to browse multiple pages of BlogEntries
- **FeatureBranch**: A Git branch separate from the main branch for development

## Requirements

### Requirement 1

**User Story:** As a user, I want the search box to be located in the top banner, so that I can quickly search my entries from anywhere on the page without scrolling.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the Application SHALL display the SearchBar component within the Header component
2. WHEN a User types a search query in the SearchBar and submits THEN the Application SHALL filter BlogEntries based on the query
3. WHEN search results are available THEN the Application SHALL display the SearchResults in the RightPanel
4. WHEN the SearchBar is empty and submitted THEN the Application SHALL clear the search and display recent BlogEntries in reverse chronological order

### Requirement 2

**User Story:** As a user, I want the calendar to appear on the left panel of the home page, so that I can easily see which dates have entries and select a specific date.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the Application SHALL display the Calendar in the LeftPanel
2. WHEN the Calendar renders THEN the Application SHALL mark dates that contain BlogEntries with a visual indicator
3. WHEN a User selects a date on the Calendar THEN the Application SHALL filter BlogEntries to show only entries from that date
4. WHILE displaying search results THEN the Application SHALL continue to display the Calendar in the LeftPanel

### Requirement 3

**User Story:** As a user, I want blog entries to be displayed in the right panel in reverse chronological order, so that I can see my most recent entries first.

#### Acceptance Criteria

1. WHEN the Dashboard loads without an active search THEN the Application SHALL display BlogEntries in the RightPanel sorted by creation date in descending order
2. WHEN BlogEntries are displayed THEN the Application SHALL show a maximum of 5 entries per page
3. WHEN a User has no BlogEntries THEN the Application SHALL display a message indicating no entries are available
4. WHEN displaying BlogEntries THEN the Application SHALL include the title, date, audio player, tags, transcription, and AI response for each entry

### Requirement 4

**User Story:** As a user, I want pagination controls at the bottom of the page when there are more than 5 entries, so that I can navigate through all my entries efficiently.

#### Acceptance Criteria

1. WHEN the total number of BlogEntries exceeds 5 THEN the Application SHALL display pagination controls at the bottom of the RightPanel
2. WHEN a User clicks on a page number THEN the Application SHALL display the corresponding set of BlogEntries for that page
3. WHEN pagination controls are displayed THEN the Application SHALL indicate the current page number
4. WHEN the total number of BlogEntries is 5 or fewer THEN the Application SHALL not display pagination controls
5. WHEN search results exceed 5 entries THEN the Application SHALL display pagination controls for the SearchResults

### Requirement 5

**User Story:** As a user, I want to clearly see when I'm viewing search results, so that I understand the context of what's being displayed.

#### Acceptance Criteria

1. WHEN search results are displayed THEN the Application SHALL show a message indicating the search query that was used on top of the results
2. WHEN search results are displayed THEN the Application SHALL provide a clear way to return to viewing all recent entries
3. WHEN no search results are found THEN the Application SHALL display a message indicating no entries match the search query
4. WHEN displaying search results THEN the Application SHALL maintain the same BlogEntry display format as non-search views


