# Design Document

## Overview

This design document outlines the technical approach for redesigning the frontend of the audio blog therapist application. The redesign focuses on three main improvements:

1. **Search Integration in Header**: Moving the SearchBar component from the Dashboard page into the Header component, making it globally accessible and maintaining search state across the application.

2. **Two-Panel Layout**: Implementing a responsive two-panel layout with the Calendar in the left panel and blog entries in the right panel, providing a clear visual separation of navigation and content.

3. **Pagination System**: Adding a pagination mechanism to display blog entries in manageable chunks of 5 entries per page, with navigation controls when multiple pages exist.

The design maintains the existing component structure where possible, leveraging the already-implemented LeftPanel and RightPanel components, while refactoring state management to support the new search and pagination requirements.

## Architecture

### Component Hierarchy

```
App
├── Header (with SearchBar)
│   ├── Navigation
│   ├── SearchBar (moved from Dashboard)
│   └── User Profile
└── Routes
    ├── Auth
    ├── Upload
    └── Dashboard (Home)
        ├── LeftPanel
        │   └── Calendar
        └── RightPanel
            ├── SearchStatus
            ├── BlogEntryCard (x5 per page)
            └── PaginationControls
```

### State Management Flow

The application will use React's built-in state management with the following flow:

1. **App Component**: Manages global search query state and passes it down to Header and Dashboard
2. **Header Component**: Contains SearchBar and handles search input, calling the onSearch callback
3. **Dashboard Component**: 
   - Fetches all audio entries from Firestore
   - Manages pagination state (current page)
   - Manages date filter state
   - Computes filtered entries based on search query or date selection
   - Passes appropriate data to LeftPanel and RightPanel

### Data Flow

```
User Input (Search/Date/Page) 
  → State Update in Dashboard
  → Filter/Sort Logic
  → Paginated Slice
  → RightPanel Display
```

## Components and Interfaces

### Modified Components

#### 1. App Component

**Changes:**
- Add `searchQuery` state
- Add `handleSearch` function
- Pass `onSearch` and `searchQuery` props to Header
- Pass `searchQuery` prop to Dashboard

**Interface:**
```typescript
interface AppState {
  searchQuery: string;
}

interface AppMethods {
  handleSearch: (query: string) => void;
}
```

#### 2. Header Component

**Changes:**
- Accept `onSearch` and `searchQuery` props
- Integrate SearchBar component into header layout
- Position SearchBar between navigation and user profile

**Interface:**
```typescript
interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}
```

#### 3. SearchBar Component

**Changes:**
- Accept `initialQuery` prop to sync with parent state
- Use `useEffect` to update local query state when `initialQuery` changes
- Add accessibility attributes (aria-label, role)

**Interface:**
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}
```

#### 4. Dashboard Component

**Changes:**
- Accept `searchQuery` prop from App
- Remove local SearchBar component
- Implement default view showing all entries (no date filter)
- Modify `getFilteredEntries` to:
  - Return search results when `searchQuery` is present
  - Return date-filtered entries when date is selected and no search
  - Return all entries sorted by date/time descending by default
- Add pagination logic:
  - Track `currentPage` state
  - Calculate `totalPages` based on filtered entries
  - Slice entries for current page
  - Reset to page 1 when filters change
- Pass `isSearching` flag to RightPanel

**Interface:**
```typescript
interface DashboardProps {
  searchQuery?: string;
}

interface DashboardState {
  audioEntries: AudioEntry[];
  user: User | null;
  loading: boolean;
  date: Date | Date[];
  activeChatEntry: AudioEntry | null;
  isSearching: boolean;
  currentPage: number;
}

const entriesPerPage = 5;
```

### Existing Components (No Changes Required)

#### LeftPanel Component
Already implemented with Calendar and date selection functionality.

#### RightPanel Component
Already implemented with SearchStatus, BlogEntryCard, and PaginationControls.

#### SearchStatus Component
Displays search query and result count when searching.

#### BlogEntryCard Component
Displays individual blog entry with all details.

#### PaginationControls Component
Displays page navigation when multiple pages exist.

## Data Models

### AudioEntry

```typescript
interface AudioEntry {
  entryId: string;
  userId: string;
  title: string;
  audioUrl: string;
  tags: string[];
  transcription: string;
  aiResponse: string;
  createdAt: Date; // JavaScript Date object
}
```

### Pagination State

```typescript
interface PaginationState {
  currentPage: number;
  entriesPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search query propagation and filtering

*For any* search query entered in the Header SearchBar, the Dashboard component should receive that exact query and display only BlogEntries where the transcription, title, or tags contain the query string (case-insensitive), and these results should appear in the RightPanel

**Validates: Requirements 1.2, 1.3**

### Property 2: Default view shows all entries

*For any* set of blog entries, when the Dashboard loads without a search query or date selection, all entries should be displayed in the RightPanel sorted by creation date and time in descending order (most recent first)

**Validates: Requirements 3.1, 3.5**

### Property 3: Pagination slice correctness

*For any* page number `p` and list of filtered entries, the displayed entries should be exactly the slice from index `(p-1) * 5` to index `p * 5` of the filtered list

**Validates: Requirements 4.2**

### Property 4: Pagination visibility

*For any* filtered entry list with count `n`, pagination controls should be visible if and only if `n > 5`, regardless of whether the entries are from search results, date filtering, or default view

**Validates: Requirements 4.1, 4.4, 4.5**

### Property 5: Page reset on filter change

*For any* change to search query or date filter, the current page number should reset to 1

**Validates: Requirements 4.2**

### Property 6: Search result indication

*For any* non-empty search query, the display should show a message containing the search query text and provide a clear mechanism to clear the search and return to the default view

**Validates: Requirements 5.1, 5.2**

### Property 7: Calendar date marking

*For any* date on the calendar, a visual indicator should be present if and only if at least one blog entry exists with a creation date matching that calendar date (same day, month, and year)

**Validates: Requirements 2.2**

### Property 8: Entry display completeness

*For any* displayed blog entry, the rendered output should include all required fields: title, date with time, audio player, tags, transcription, and AI response

**Validates: Requirements 3.4**

## Error Handling

### Search Errors
- **Empty Results**: Display "No entries match your search" message when search returns zero results
- **Invalid Input**: Sanitize search input to prevent XSS attacks

### Pagination Errors
- **Invalid Page Number**: Clamp page number to valid range [1, totalPages]
- **Empty Page**: If current page becomes empty due to deletion, navigate to previous page or page 1

### Date Selection Errors
- **Invalid Date**: Validate date selection and default to current date if invalid
- **No Entries for Date**: Display "No entries for this date" message

### Data Fetching Errors
- **Firestore Errors**: Log errors and display "Error loading entries" message
- **Authentication Errors**: Redirect to login page if user is not authenticated

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **SearchBar Component**
   - Renders with initial query
   - Updates local state on input change
   - Calls onSearch callback on form submit
   - Syncs with initialQuery prop changes

2. **Dashboard Filtering Logic**
   - Returns all entries when no filters applied
   - Filters by search query correctly
   - Filters by date correctly
   - Handles empty results

3. **Pagination Calculations**
   - Calculates correct total pages
   - Slices entries correctly for each page
   - Handles edge cases (0 entries, exactly 5 entries, 6 entries)

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (a property-based testing library for TypeScript/JavaScript). Each test will run a minimum of 100 iterations.

1. **Property 1: Search query propagation**
   - Generate random search queries
   - Verify Dashboard receives exact query from Header
   - **Feature: frontend-redesign, Property 1: Search query propagation**

2. **Property 2: Default view shows all entries**
   - Generate random sets of blog entries
   - Verify all entries appear when no filters applied
   - Verify descending date/time sort order
   - **Feature: frontend-redesign, Property 2: Default view shows all entries**

3. **Property 3: Pagination slice correctness**
   - Generate random entry lists and page numbers
   - Verify slice indices are correct
   - **Feature: frontend-redesign, Property 3: Pagination slice correctness**

4. **Property 4: Pagination visibility**
   - Generate entry lists of various sizes
   - Verify pagination shows when count > 5, hidden when count ≤ 5
   - **Feature: frontend-redesign, Property 4: Pagination visibility**

5. **Property 5: Page reset on filter change**
   - Generate random filter changes
   - Verify page always resets to 1
   - **Feature: frontend-redesign, Property 5: Page reset on filter change**

6. **Property 6: Search result indication**
   - Generate random search queries
   - Verify search indicator appears with query text
   - **Feature: frontend-redesign, Property 6: Search result indication**

7. **Property 7: Calendar date marking**
   - Generate random entry sets with various dates
   - Verify dates with entries are marked, dates without are not
   - **Feature: frontend-redesign, Property 7: Calendar date marking**

8. **Property 8: Entry display completeness**
   - Generate random blog entries
   - Verify all required fields are present in rendered output
   - **Feature: frontend-redesign, Property 8: Entry display completeness**

### Integration Testing

Integration tests will verify the complete user workflows:

1. **Search Workflow**
   - User enters search query in header
   - Results display in Dashboard
   - Clear search returns to default view

2. **Date Filter Workflow**
   - User selects date on calendar
   - Entries filter to selected date
   - Pagination updates accordingly

3. **Pagination Workflow**
   - User navigates between pages
   - Correct entries display on each page
   - Page state persists during same filter

### Testing Framework

- **Unit Tests**: Jest + React Testing Library
- **Property-Based Tests**: fast-check
- **Test Configuration**: Existing Jest configuration in `frontend/package.json`

## Implementation Notes

### CSS Styling

The Header will need CSS updates to accommodate the SearchBar:

```css
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-search {
  flex: 1;
  max-width: 400px;
}
```

### Accessibility

- SearchBar includes proper ARIA labels and roles
- Pagination controls are keyboard navigable
- Screen reader announcements for search results and page changes

### Performance Considerations

- Filtering and sorting operations are performed in-memory (client-side)
- Pagination reduces DOM nodes by rendering only 5 entries at a time
- Calendar date marking uses efficient date comparison

### Git Workflow

All changes will be developed on a feature branch:

```bash
git checkout -b feature/frontend-redesign
# Make changes
git commit -m "Implement frontend redesign"
git push origin feature/frontend-redesign
# Create pull request to main
```
