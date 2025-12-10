import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchStatus from './SearchStatus';

describe('SearchStatus Empty State', () => {
  const mockOnClearSearch = jest.fn();

  it('should display "No entries match" message when search has no results', () => {
    render(
      <SearchStatus
        isSearching={true}
        searchQuery="nonexistent"
        resultCount={0}
        onClearSearch={mockOnClearSearch}
      />
    );
    expect(screen.getByText(/No entries match/)).toBeInTheDocument();
    expect(screen.getByText(/nonexistent/)).toBeInTheDocument();
  });

  it('should display search results count when results are found', () => {
    render(
      <SearchStatus
        isSearching={true}
        searchQuery="test"
        resultCount={5}
        onClearSearch={mockOnClearSearch}
      />
    );
    expect(screen.getByText(/Search results for/)).toBeInTheDocument();
    expect(screen.getByText(/5 found/)).toBeInTheDocument();
  });

  it('should not render when not searching', () => {
    render(
      <SearchStatus
        isSearching={false}
        searchQuery=""
        resultCount={0}
        onClearSearch={mockOnClearSearch}
      />
    );
    // When not searching, the component should not display any search-related content
    expect(screen.queryByText(/Search results for/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No entries match/)).not.toBeInTheDocument();
  });

  it('should call onClearSearch when clear button is clicked', () => {
    render(
      <SearchStatus
        isSearching={true}
        searchQuery="test"
        resultCount={3}
        onClearSearch={mockOnClearSearch}
      />
    );
    
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    userEvent.click(clearButton);
    
    expect(mockOnClearSearch).toHaveBeenCalled();
  });
});
