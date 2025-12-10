import React from 'react';
import { render, screen } from '@testing-library/react';
import RightPanel from './RightPanel';
import { AudioEntry } from '../models/audioEntry';

describe('RightPanel Empty States', () => {
  const mockOnPageChange = jest.fn();
  const mockOnClearSearch = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnChat = jest.fn();

  const defaultProps = {
    entries: [],
    totalFilteredCount: 0,
    currentPage: 1,
    entriesPerPage: 5,
    totalPages: 0,
    isSearching: false,
    searchQuery: '',
    hasAnyEntries: false,
    isDateFiltered: false,
    onPageChange: mockOnPageChange,
    onClearSearch: mockOnClearSearch,
    onDelete: mockOnDelete,
    onChat: mockOnChat,
  };

  it('should display "No entries available" when there are no entries at all', () => {
    render(<RightPanel {...defaultProps} hasAnyEntries={false} />);
    expect(screen.getByText('No entries available')).toBeInTheDocument();
  });

  it('should display "No entries for this date" when date filtered with no results', () => {
    render(
      <RightPanel
        {...defaultProps}
        hasAnyEntries={true}
        isDateFiltered={true}
        totalFilteredCount={0}
      />
    );
    expect(screen.getByText('No entries for this date')).toBeInTheDocument();
  });

  it('should not display empty message when searching (SearchStatus handles it)', () => {
    render(
      <RightPanel
        {...defaultProps}
        hasAnyEntries={true}
        isSearching={true}
        searchQuery="test"
        totalFilteredCount={0}
      />
    );
    // SearchStatus component should handle the message
    expect(screen.queryByText('No entries available')).not.toBeInTheDocument();
    expect(screen.queryByText('No entries for this date')).not.toBeInTheDocument();
  });

  it('should not display empty message when there are entries to display', () => {
    const mockEntry: AudioEntry = {
      entryId: '1',
      userId: 'user1',
      title: 'Test Entry',
      audioUrl: 'http://example.com/audio.mp3',
      tags: ['test'],
      transcription: 'Test transcription',
      aiResponse: 'Test response',
      createdAt: new Date(),
    };

    render(
      <RightPanel
        {...defaultProps}
        entries={[mockEntry]}
        hasAnyEntries={true}
        totalFilteredCount={1}
      />
    );
    expect(screen.queryByText('No entries available')).not.toBeInTheDocument();
    expect(screen.queryByText('No entries for this date')).not.toBeInTheDocument();
  });
});
