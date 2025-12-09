# Design Document: Frontend Redesign

## Overview

This design document outlines the technical approach for redesigning the frontend user interface of the audio blog therapist application. The redesign focuses on three main improvements:

1. **Header Integration**: Moving the SearchBar component from the Dashboard body into the Header component for persistent accessibility
2. **Two-Panel Layout**: Implementing a split-panel layout with Calendar on the left (30% width) and blog entries on the right (70% width)
3. **Pagination System**: Adding pagination controls to handle large sets of blog entries efficiently

The redesign maintains the existing React/TypeScript architecture and Firebase integration while improving the user experience through better layout organization and navigation.

## Architecture

### Component Hierarchy

```
App
├── Header (modified)
│   ├── Navigation Links
│   ├── SearchBar (relocated)
│   └── User Profile
└── Dashboard (modified)
    ├── LeftPanel (new)
    │   └── Calendar
    └── RightPanel (new)
        ├── SearchStatus (new)
        ├── BlogEntryList (new)
        │   └── BlogEntryCard (extracted)
        └── PaginationControls (new)
```

### State Management

The Dashboard component will manage the following state:
- `audioEntries`: All entries fetched from Firestore
- `searchQuery`: Current search query string
- `isSearching`: Boolean flag indicating active search
- `selectedDate`: Currently selected calendar date
- `currentPage`: Current pagination page number
- `entriesPerPage`: Number of entries per page (constant: 5)

State will flow down through props to child components, with callbacks passed for user interactions.

## Components and Interfaces

### Modified Components

#### Header Component
**Purpose**: Top navigation bar with integrated search functionality

**Props**: None (uses Firebase auth context)

**New Features**:
- Integrates SearchBar component
- Passes search callback to Dashboard via URL params or global state

**Interface**:
```typescript
interface HeaderProps {
  onSearch?: (query: string) => void;
}
```

#### Dashboard Component
**Purpose**: Main page orchestrating the two-panel layout

**Responsibilities**:
- Fetch and manage audio entries
- Handle search logic
- Manage pagination state
- Coordinate calendar date selection
- Filter entries based on search/date

**State**:
```typescript
interface DashboardState {
  audioEntries: AudioEntry[];
  searchQuery: string;
  isSearching: boolean;
  selectedDate: Date | null;
  currentPage: number;
  loading: boolean;
  user: User | null;
}
```

### New Components

#### LeftPanel Component
**Purpose**: Container for the calendar with consistent styling

**Props**:
```typescript
interface LeftPanelProps {
  audioEntries: AudioEntry[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}
```

**Responsibilities**:
- Render Calendar component
- Mark dates with entries
- Handle date selection

#### RightPanel Component
**Purpose**: Container for blog entries and pagination

**Props**:
```typescript
interface RightPanelProps {
  entries: AudioEntry[];
  currentPage: number;
  entriesPerPage: number;
  isSearching: boolean;
  searchQuery: string;
  onPageChange: (page: number) => void;
  onClearSearch: () => void;
  onDelete: (entryId: string) => void;
  onChat: (entry: AudioEntry) => void;
}
```

#### SearchStatus Component
**Purpose**: Display search context and clear option

**Props**:
```typescript
interface SearchStatusProps {
  isSearching: boolean;
  searchQuery: string;
  resultCount: number;
  onClearSearch: () => void;
}
```

**Rendering Logic**:
- When searching: "Search results for '{query}' ({count} found)" + Clear button
- When no results: "No entries match '{query}'" + Clear button
- When not searching: Hidden

#### BlogEntryList Component
**Purpose**: Render paginated list of blog entries

**Props**:
```typescript
interface BlogEntryListProps {
  entries: AudioEntry[];
  onDelete: (entryId: string) => void;
  onChat: (entry: AudioEntry) => void;
}
```

#### BlogEntryCard Component
**Purpose**: Display individual blog entry (extracted from Dashboard)

**Props**:
```typescript
interface BlogEntryCardProps {
  entry: AudioEntry;
  onDelete: (entryId: string) => void;
  onChat: (entry: AudioEntry) => void;
}
```

#### PaginationControls Component
**Purpose**: Navigation controls for multiple pages

**Props**:
```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

**Features**:
- Previous/Next buttons
- Page number buttons (with ellipsis for large page counts)
- Current page indicator
- Disabled state when only one page

## Data Models

### AudioEntry (existing)
```typescript
interface AudioEntry {
  entryId: string;
  userId: string;
  title: string;
  audioUrl: string;
  tags: string[];
  transcription: string;
  aiResponse: string;
  createdAt: Date;
}
```

### PaginationState (new)
```typescript
interface PaginationState {
  currentPage: number;
  totalPages: number;
  entriesPerPage: number;
  totalEntries: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Search filtering correctness
*For any* search query string and set of blog entries, all filtered results should only include entries where the query appears in the transcription, title, or tags (case-insensitive)
**Validates: Requirements 1.2**

### Property 2: Search results display consistency
*For any* search results, they should be displayed in the RightPanel with the same BlogEntry format as non-search views
**Validates: Requirements 1.3, 5.4**

### Property 3: Calendar date marking
*For any* set of blog entries, the Calendar should mark all dates that contain at least one entry with a visual indicator
**Validates: Requirements 2.2**

### Property 4: Date filter correctness
*For any* selected date on the Calendar, the displayed entries should only include entries created on that specific date (matching day, month, and year)
**Validates: Requirements 2.3**

### Property 5: Calendar persistence during search
*For any* search state (active or inactive), the Calendar should remain visible in the LeftPanel
**Validates: Requirements 2.4**

### Property 6: Chronological ordering
*For any* set of blog entries displayed without an active search, they should be sorted by creation date in descending order (newest first)
**Validates: Requirements 3.1**

### Property 7: Pagination page size limit
*For any* page of displayed entries, the number of entries shown should not exceed 5
**Validates: Requirements 3.2**

### Property 8: Entry field completeness
*For any* displayed blog entry, the rendered output should include all required fields: title, date, audio player, tags, transcription, and AI response
**Validates: Requirements 3.4**

### Property 9: Pagination visibility threshold
*For any* set of entries (search results or all entries), pagination controls should be visible if and only if the total count exceeds 5
**Validates: Requirements 4.1, 4.5**

### Property 10: Pagination navigation correctness
*For any* valid page number selection, the displayed entries should be the correct subset corresponding to that page (entries [page * 5] through [(page + 1) * 5 - 1])
**Validates: Requirements 4.2**

### Property 11: Current page indication
*For any* state where pagination controls are visible, the current page number should be visually indicated in the pagination UI
**Validates: Requirements 4.3**

### Property 12: Search query display
*For any* active search, the search query string should be displayed above the results
**Validates: Requirements 5.1**

### Property 13: Clear search availability
*For any* active search state, a clear/reset control should be available to return to viewing all recent entries
**Validates: Requirements 5.2**

## Error Handling

### Search Errors
- **Empty Query Submission**: Clear search state and display all recent entries
- **No Results Found**: Display user-friendly message with search query and clear option
- **Invalid Characters**: Sanitize input to prevent XSS attacks

### Pagination Errors
- **Invalid Page Number**: Default to page 1
- **Page Out of Bounds**: Redirect to last valid page
- **State Desync**: Recalculate total pages when entries change

### Calendar Errors
- **Invalid Date Selection**: Ignore and maintain current selection
- **Date Without Entries**: Display empty state message for that date
- **Timezone Issues**: Use consistent timezone (user's local time) for all date comparisons

### Data Fetching Errors
- **Firestore Connection Failure**: Display error message and retry button
- **Authentication Expiry**: Redirect to login page
- **Partial Data Load**: Display loaded entries with warning message

## Testing Strategy

### Unit Testing

We will use **Jest** and **React Testing Library** for unit testing, which are already configured in the project.

**Unit Test Coverage**:
- SearchBar component: form submission, input handling, empty query handling
- PaginationControls component: button clicks, page number rendering, disabled states
- BlogEntryCard component: rendering all fields, delete/chat button clicks
- Calendar date marking logic: tileContent function with various entry sets
- Filtering logic: date filtering, search filtering edge cases
- Empty states: no entries, no search results

**Example Unit Tests**:
```typescript
describe('SearchBar', () => {
  it('should call onSearch with query when form is submitted', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    // ... test implementation
  });
  
  it('should clear search when empty query is submitted', () => {
    // ... test implementation
  });
});

describe('PaginationControls', () => {
  it('should not render when totalPages is 1', () => {
    // ... test implementation
  });
  
  it('should highlight current page', () => {
    // ... test implementation
  });
});
```

### Property-Based Testing

We will use **fast-check** for property-based testing in TypeScript.

**Configuration**:
- Minimum 100 iterations per property test
- Custom generators for AudioEntry objects
- Shrinking enabled for minimal failing examples

**Property Test Requirements**:
- Each property test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: frontend-redesign, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Generators Needed**:
```typescript
// Generate random AudioEntry objects
const audioEntryArbitrary = fc.record({
  entryId: fc.uuid(),
  userId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  audioUrl: fc.webUrl(),
  tags: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
  transcription: fc.lorem({ maxCount: 50 }),
  aiResponse: fc.lorem({ maxCount: 50 }),
  createdAt: fc.date()
});

// Generate search queries
const searchQueryArbitrary = fc.string({ minLength: 1, maxLength: 50 });

// Generate page numbers
const pageNumberArbitrary = fc.nat({ max: 100 });
```

**Property Tests to Implement**:
1. Search filtering correctness (Property 1)
2. Calendar date marking (Property 3)
3. Date filter correctness (Property 4)
4. Chronological ordering (Property 6)
5. Pagination page size limit (Property 7)
6. Entry field completeness (Property 8)
7. Pagination visibility threshold (Property 9)
8. Pagination navigation correctness (Property 10)

**Note**: Properties 2, 5, 11, 12, 13 are primarily UI rendering properties that are better suited for unit tests with React Testing Library rather than property-based tests.

### Integration Testing

**Integration Test Scenarios**:
- Search → Pagination interaction: Verify pagination updates when search results change
- Calendar → Search interaction: Verify search works independently of calendar date selection
- Delete entry → UI update: Verify entry removal updates calendar markers and pagination
- Full user flow: Load dashboard → Select date → Search → Navigate pages → Clear search

### Manual Testing Checklist

- Visual verification of two-panel layout (30/70 split)
- Responsive behavior on different screen sizes
- Calendar visual indicators are clearly visible
- Pagination controls are intuitive and accessible
- Search bar integration in header looks polished
- Smooth transitions between search and non-search states

## Implementation Notes

### CSS Layout Strategy

Use **CSS Flexbox** for the two-panel layout:
```css
.dashboard-container {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.left-panel {
  flex: 0 0 30%;
  min-width: 300px;
}

.right-panel {
  flex: 1;
  min-width: 0; /* Prevent flex item overflow */
}
```

### State Management Considerations

- Keep search state in Dashboard component
- Pass search callback from Header to Dashboard via props (lift state up to App if needed)
- Use React Context if prop drilling becomes excessive
- Consider URL query parameters for search/page state (enables bookmarking/sharing)

### Performance Optimizations

- **Memoization**: Use `useMemo` for filtered/paginated entry calculations
- **Callback Stability**: Use `useCallback` for event handlers passed to child components
- **Virtual Scrolling**: Consider if entry cards become complex (not needed for 5 entries/page)
- **Debouncing**: Add debounce to search input (300ms delay) to reduce re-renders

### Accessibility Requirements

- Pagination controls must be keyboard navigable
- Search bar must have proper ARIA labels
- Calendar must support keyboard navigation
- Screen reader announcements for search results count
- Focus management when navigating between pages

### Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- CSS Grid/Flexbox support required
- ES6+ JavaScript features (already using TypeScript)
- No IE11 support needed

## Migration Strategy

### Phase 1: Component Extraction
1. Extract BlogEntryCard from Dashboard
2. Create LeftPanel and RightPanel container components
3. Create PaginationControls component
4. Create SearchStatus component

### Phase 2: Layout Restructuring
1. Implement two-panel CSS layout in Dashboard
2. Move Calendar into LeftPanel
3. Move entry rendering into RightPanel
4. Test layout responsiveness

### Phase 3: Search Integration
1. Move SearchBar into Header component
2. Implement search callback communication (App → Dashboard)
3. Add SearchStatus component to RightPanel
4. Test search functionality

### Phase 4: Pagination Implementation
1. Add pagination state to Dashboard
2. Implement pagination logic (calculate pages, slice entries)
3. Integrate PaginationControls component
4. Test pagination with various entry counts

### Phase 5: Testing & Polish
1. Write unit tests for all new components
2. Write property-based tests for core logic
3. Perform integration testing
4. Fix bugs and refine UI/UX
5. Accessibility audit and fixes

## Dependencies

### Existing Dependencies
- `react`: ^18.x (UI framework)
- `react-router-dom`: ^6.x (routing)
- `firebase`: ^10.x (backend services)
- `react-calendar`: ^4.x (calendar component)
- `@testing-library/react`: ^14.x (testing)
- `jest`: ^29.x (test runner)

### New Dependencies
- `fast-check`: ^3.x (property-based testing library)

**Installation**:
```bash
npm install --save-dev fast-check
```

## Future Enhancements

- **Advanced Search**: Filter by date range, tags, or AI response content
- **Sorting Options**: Allow user to choose sort order (oldest first, alphabetical)
- **Entries Per Page**: User preference for 5, 10, or 20 entries per page
- **Calendar Views**: Month/week/year views with different granularity
- **Keyboard Shortcuts**: Quick navigation (j/k for next/prev entry, / for search)
- **Export Functionality**: Download entries as PDF or markdown
- **Bulk Operations**: Select multiple entries for batch delete or tag editing
