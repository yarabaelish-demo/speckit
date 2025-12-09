# Implementation Plan: Frontend Redesign

- [x] 1. Extract and create new component files
- [x] 1.1 Create BlogEntryCard component
  - Extract blog entry rendering logic from Dashboard.tsx
  - Create new file: `frontend/src/components/BlogEntryCard.tsx`
  - Implement props interface with entry, onDelete, and onChat callbacks
  - Include all required fields: title, date, audio player, tags, transcription, AI response, and action buttons
  - _Requirements: 3.4_

- [x] 1.2 Create PaginationControls component
  - Create new file: `frontend/src/components/PaginationControls.tsx`
  - Implement props interface with currentPage, totalPages, and onPageChange
  - Add Previous/Next buttons with disabled states
  - Add page number buttons with current page highlighting
  - Hide component when totalPages <= 1
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 1.3 Create SearchStatus component
  - Create new file: `frontend/src/components/SearchStatus.tsx`
  - Implement props interface with isSearching, searchQuery, resultCount, and onClearSearch
  - Display search query and result count when searching
  - Display "no results" message when count is 0
  - Include clear/reset button
  - Hide component when not searching
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 1.4 Create LeftPanel component
  - Create new file: `frontend/src/components/LeftPanel.tsx`
  - Implement props interface with audioEntries, selectedDate, and onDateSelect
  - Render Calendar component with date marking logic
  - Apply styling for 30% width container
  - _Requirements: 2.1, 2.2_

- [x] 1.5 Create RightPanel component
  - Create new file: `frontend/src/components/RightPanel.tsx`
  - Implement props interface with entries, pagination state, search state, and callbacks
  - Render SearchStatus, BlogEntryList, and PaginationControls
  - Apply styling for 70% width container
  - _Requirements: 1.3, 3.1, 4.1_

- [x] 2. Implement pagination logic in Dashboard
- [x] 2.1 Add pagination state management
  - Add currentPage state (default: 1)
  - Add entriesPerPage constant (value: 5)
  - Calculate totalPages based on filtered entries
  - Implement page change handler
  - Reset to page 1 when search or date filter changes
  - _Requirements: 3.2, 4.2_

- [x] 2.2 Implement entry slicing for pagination
  - Calculate start and end indices based on currentPage
  - Slice filtered entries array for current page
  - Handle edge cases (empty arrays, out of bounds pages)
  - _Requirements: 3.2, 4.2_

- [ ]* 2.3 Write property test for pagination page size limit
  - **Property 7: Pagination page size limit**
  - **Validates: Requirements 3.2**

- [ ]* 2.4 Write property test for pagination navigation correctness
  - **Property 10: Pagination navigation correctness**
  - **Validates: Requirements 4.2**

- [ ]* 2.5 Write property test for pagination visibility threshold
  - **Property 9: Pagination visibility threshold**
  - **Validates: Requirements 4.1, 4.5**

- [x] 3. Integrate SearchBar into Header component
- [x] 3.1 Move SearchBar to Header
  - Import SearchBar component in Header.tsx
  - Add SearchBar to header layout (between nav and profile)
  - Style SearchBar to fit header design
  - _Requirements: 1.1_

- [x] 3.2 Implement search state communication
  - Lift search state to App component or use URL params
  - Pass search callback from Header through App to Dashboard
  - Update Dashboard to receive and handle search callback
  - Ensure search query persists in SearchBar when active
  - _Requirements: 1.2_

- [x] 3.3 Implement search filtering logic
  - Update handleSearch function to set search state
  - Filter entries by transcription, title, and tags (case-insensitive)
  - Sort search results by creation date descending
  - Handle empty query submission (clear search)
  - _Requirements: 1.2, 1.4_

- [ ]* 3.4 Write property test for search filtering correctness
  - **Property 1: Search filtering correctness**
  - **Validates: Requirements 1.2**

- [ ]* 3.5 Write unit tests for search functionality
  - Test SearchBar form submission with various queries
  - Test empty query handling
  - Test search state clearing
  - Test search results filtering logic
  - _Requirements: 1.2, 1.4_

- [x] 4. Restructure Dashboard with two-panel layout
- [x] 4.1 Implement CSS layout for two panels
  - Create flexbox container in Dashboard
  - Add CSS for 30/70 split with gap
  - Ensure responsive behavior (min-widths)
  - Add styling to App.css or Dashboard-specific CSS file
  - _Requirements: 2.1, 3.1_

- [x] 4.2 Integrate LeftPanel with Calendar
  - Replace inline Calendar with LeftPanel component
  - Pass audioEntries, selectedDate, and onDateSelect props
  - Verify calendar date marking works correctly
  - Ensure calendar remains visible during search
  - _Requirements: 2.1, 2.2, 2.4_

- [ ]* 4.3 Write property test for calendar date marking
  - **Property 3: Calendar date marking**
  - **Validates: Requirements 2.2**

- [ ]* 4.4 Write property test for calendar persistence during search
  - **Property 5: Calendar persistence during search**
  - **Validates: Requirements 2.4**

- [x] 4.3 Integrate RightPanel with entry display
  - Replace inline entry rendering with RightPanel component
  - Pass paginated entries, search state, and callbacks
  - Verify entries display in correct order
  - Ensure all entry fields are rendered
  - _Requirements: 3.1, 3.4_

- [ ]* 4.4 Write property test for chronological ordering
  - **Property 6: Chronological ordering**
  - **Validates: Requirements 3.1**

- [ ]* 4.5 Write property test for entry field completeness
  - **Property 8: Entry field completeness**
  - **Validates: Requirements 3.4**

- [ ] 5. Implement date filtering with calendar
- [ ] 5.1 Update date selection handler
  - Modify onDateSelect to filter entries by selected date
  - Ensure date comparison matches day, month, and year
  - Clear search when date is selected (or maintain both filters)
  - Update UI to show selected date context
  - _Requirements: 2.3_

- [ ] 5.2 Write property test for date filter correctness
  - **Property 4: Date filter correctness**
  - **Validates: Requirements 2.3**

- [ ]* 5.3 Write unit tests for date filtering
  - Test date selection with various entry sets
  - Test date comparison logic (same day/month/year)
  - Test empty state when no entries for selected date
  - _Requirements: 2.3, 3.3_

- [x] 6. Add empty state handling
- [x] 6.1 Implement empty state messages
  - Add "No entries available" message when audioEntries is empty
  - Add "No entries for this date" message when date filter returns empty
  - Add "No entries match your search" message in SearchStatus
  - Style empty state messages consistently
  - _Requirements: 3.3, 5.3_

- [ ]* 6.2 Write unit tests for empty states
  - Test empty entries array rendering
  - Test empty search results rendering
  - Test empty date filter rendering
  - _Requirements: 3.3, 5.3_

- [x] 7. Install and configure property-based testing
- [x] 7.1 Install fast-check dependency
  - Run: `npm install --save-dev fast-check`
  - Verify installation in package.json
  - _Requirements: All property tests_

- [x] 7.2 Create test utilities and generators
  - Create file: `frontend/src/test-utils/generators.ts`
  - Implement audioEntryArbitrary generator
  - Implement searchQueryArbitrary generator
  - Implement pageNumberArbitrary generator
  - Configure generators with appropriate constraints
  - _Requirements: All property tests_

- [x] 8. Final integration and polish
- [x] 8.1 Test complete user flows
  - Test: Load dashboard → View entries → Navigate pages
  - Test: Search entries → View results → Clear search
  - Test: Select date → View filtered entries → Select different date
  - Test: Search → Paginate results → Clear search
  - Test: Delete entry → Verify UI updates (calendar, pagination)
  - _Requirements: All_

- [ ]* 8.2 Write integration tests
  - Test search and pagination interaction
  - Test calendar and search interaction
  - Test delete entry and UI update flow
  - _Requirements: All_

- [x] 8.3 Accessibility improvements
  - Add ARIA labels to SearchBar
  - Ensure keyboard navigation for pagination
  - Add screen reader announcements for search results count
  - Test focus management between pages
  - _Requirements: All_

- [ ]* 8.4 Write accessibility tests
  - Test keyboard navigation for pagination
  - Test ARIA labels presence
  - Test focus management
  - _Requirements: All_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
