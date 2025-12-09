import React from 'react';
import { render, screen } from '@testing-library/react';
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
    const { container } = render(
      <SearchStatus
        isSearching={false}
        searchQuery=""
        resultCount={0}
        onClearSearch={mockOnClearSearch}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
