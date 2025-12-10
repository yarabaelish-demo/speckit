# Implementation Plan

- [x] 1. Set up feature branch and project structure
  - Create feature branch `feature/frontend-redesign` from main
  - Ensure all dependencies are installed (fast-check for property testing)
  - _Requirements: 6.1, 6.2_

- [x] 2. Move SearchBar to Header component
  - [x] 2.1 Update App component to manage search state
    - Add `searchQuery` state to App component
    - Create `handleSearch` function to update search state
    - Pass `onSearch` and `searchQuery` props to Header
    - Pass `searchQuery` prop to Dashboard
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Integrate SearchBar into Header component
    - Update Header to accept `onSearch` and `searchQuery` props
    - Import and render SearchBar component in Header
    - Position SearchBar between navigation and user profile in header layout
    - Update CSS for header search styling
    - _Requirements: 1.1_
  
  - [x] 2.3 Update SearchBar component for controlled state
    - Add `initialQuery` prop to SearchBar interface
    - Use `useEffect` to sync local query state with `initialQuery` prop
    - Add accessibility attributes (aria-label, role, aria-describedby)
    - _Requirements: 1.1_
  
  - [ ]* 2.4 Write property test for search query propagation
    - **Property 1: Search query propagation and filtering**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ]* 2.5 Write unit tests for SearchBar component
    - Test SearchBar renders with initial query
    - Test SearchBar updates on input change
    - Test SearchBar calls onSearch on submit
    - Test SearchBar syncs with initialQuery prop changes
    - _Requirements: 1.1, 1.2_

- [x] 3. Update Dashboard for default view and search integration
  - [x] 3.1 Modify Dashboard to accept searchQuery prop
    - Update Dashboard interface to accept `searchQuery?: string`
    - Remove local SearchBar component from Dashboard
    - Add `isSearching` state based on searchQuery presence
    - _Requirements: 1.2, 3.1, 3.5_
  
  - [x] 3.2 Implement default view logic (all entries, no date filter)
    - Modify `getFilteredEntries` to return all entries by default
    - Sort all entries by `createdAt` descending (date and time)
    - Only apply date filter when user explicitly selects a date
    - _Requirements: 3.1, 3.5_
  
  - [x] 3.3 Update filtering logic for search integration
    - Check for `searchQuery` prop in `getFilteredEntries`
    - Filter entries by transcription, title, and tags when search is active
    - Sort search results by `createdAt` descending
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 3.4 Write property test for default view
    - **Property 2: Default view shows all entries**
    - **Validates: Requirements 3.1, 3.5**
  
  - [ ]* 3.5 Write unit tests for Dashboard filtering logic
    - Test returns all entries when no filters applied
    - Test filters by search query correctly
    - Test filters by date correctly
    - Test handles empty results
    - _Requirements: 1.2, 3.1, 3.5_

- [x] 4. Implement pagination system
  - [x] 4.1 Add pagination state to Dashboard
    - Add `currentPage` state (default: 1)
    - Define `entriesPerPage` constant (5)
    - Calculate `totalPages` from filtered entries
    - Calculate `startIndex` and `endIndex` for slicing
    - _Requirements: 3.2, 4.1_
  
  - [x] 4.2 Implement pagination slice logic
    - Slice filtered entries using `startIndex` and `endIndex`
    - Pass sliced entries to RightPanel as `entriesToDisplay`
    - Handle edge cases (empty list, partial last page)
    - _Requirements: 3.2, 4.2_
  
  - [x] 4.3 Add page reset on filter changes
    - Reset `currentPage` to 1 when `searchQuery` changes (useEffect)
    - Reset `currentPage` to 1 when date selection changes
    - _Requirements: 4.2_
  
  - [x] 4.4 Pass pagination props to RightPanel
    - Pass `currentPage`, `totalPages`, `entriesPerPage` to RightPanel
    - Pass `onPageChange` handler to RightPanel
    - Pass `totalFilteredCount` for display
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 4.5 Write property test for pagination slice correctness
    - **Property 3: Pagination slice correctness**
    - **Validates: Requirements 4.2**
  
  - [ ]* 4.6 Write property test for pagination visibility
    - **Property 4: Pagination visibility**
    - **Validates: Requirements 4.1, 4.4, 4.5**
  
  - [ ]* 4.7 Write property test for page reset
    - **Property 5: Page reset on filter change**
    - **Validates: Requirements 4.2**
  
  - [ ]* 4.8 Write unit tests for pagination calculations
    - Test calculates correct total pages
    - Test slices entries correctly for each page
    - Test handles edge cases (0 entries, exactly 5 entries, 6 entries)
    - _Requirements: 3.2, 4.1, 4.2_

- [x] 5. Update RightPanel for search status display
  - [x] 5.1 Pass search-related props to RightPanel
    - Pass `isSearching` boolean flag
    - Pass `searchQuery` string for display
    - Pass `onClearSearch` handler
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.2 Ensure SearchStatus component displays correctly
    - Verify SearchStatus shows when `isSearching` is true
    - Verify search query text appears in SearchStatus
    - Verify clear search button is functional
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 5.3 Write property test for search result indication
    - **Property 6: Search result indication**
    - **Validates: Requirements 5.1, 5.2**
  
  - [ ]* 5.4 Write unit tests for search status display
    - Test SearchStatus appears when searching
    - Test SearchStatus includes query text
    - Test clear button calls onClearSearch
    - _Requirements: 5.1, 5.2_

- [x] 6. Verify Calendar and LeftPanel functionality
  - [x] 6.1 Ensure Calendar displays in LeftPanel
    - Verify LeftPanel renders Calendar component
    - Verify Calendar receives audioEntries for date marking
    - _Requirements: 2.1, 2.2_
  
  - [x] 6.2 Test date selection and filtering
    - Verify selecting a date filters entries correctly
    - Verify date filter works alongside search
    - _Requirements: 2.3_
  
  - [ ]* 6.3 Write property test for calendar date marking
    - **Property 7: Calendar date marking**
    - **Validates: Requirements 2.2**
  
  - [ ]* 6.4 Write unit tests for Calendar integration
    - Test Calendar marks dates with entries
    - Test date selection triggers filter
    - Test Calendar remains visible during search
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [-] 7. Verify BlogEntry display completeness
  - [x] 7.1 Ensure all entry fields are displayed
    - Verify BlogEntryCard shows title
    - Verify date includes time information
    - Verify audio player, tags, transcription, and AI response are present
    - _Requirements: 3.4_
  
  - [ ]* 7.2 Write property test for entry display completeness
    - **Property 8: Entry display completeness**
    - **Validates: Requirements 3.4**
  
  - [ ]* 7.3 Write unit tests for BlogEntryCard
    - Test all required fields render
    - Test date format includes time
    - Test audio player has correct src
    - _Requirements: 3.4_

- [x] 8. Update CSS styling for new layout
  - [x] 8.1 Add header search styles
    - Style `.header-search` container
    - Style search input and button in header
    - Ensure responsive layout
    - _Requirements: 1.1_
  
  - [x] 8.2 Verify two-panel layout styles
    - Ensure `.dashboard-container` uses flexbox
    - Verify LeftPanel and RightPanel sizing
    - Test responsive behavior
    - _Requirements: 2.1, 3.1_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Integration testing
  - [ ]* 10.1 Write integration test for search workflow
    - Test user enters search in header
    - Test results display in Dashboard
    - Test clear search returns to default view
    - _Requirements: 1.2, 1.3, 1.4, 5.2_
  
  - [ ]* 10.2 Write integration test for date filter workflow
    - Test user selects date on calendar
    - Test entries filter to selected date
    - Test pagination updates accordingly
    - _Requirements: 2.3, 4.5_
  
  - [ ]* 10.3 Write integration test for pagination workflow
    - Test user navigates between pages
    - Test correct entries display on each page
    - Test page state persists during same filter
    - _Requirements: 4.2, 4.3_

- [-] 11. Final testing and cleanup
  - [x] 11.1 Manual testing of all features
    - Test search functionality end-to-end
    - Test default view displays all entries
    - Test pagination with various entry counts
    - Test date filtering
    - Test responsive layout
    - _Requirements: All_
  
  - [x] 11.2 Code review and cleanup
    - Remove any console.log statements
    - Ensure code follows project conventions
    - Update comments and documentation
    - _Requirements: All_
  
  - [-] 11.3 Prepare for merge
    - Ensure all tests pass
    - Commit final changes to feature branch
    - Create pull request to main branch
    - _Requirements: 6.3_
