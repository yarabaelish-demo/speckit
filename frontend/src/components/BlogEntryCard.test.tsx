import React from 'react';
import { render, screen } from '@testing-library/react';
import BlogEntryCard from './BlogEntryCard';
import { AudioEntry } from '../models/audioEntry';

describe('BlogEntryCard', () => {
  const mockEntry: AudioEntry = {
    entryId: 'test-entry-1',
    userId: 'test-user-1',
    title: 'Test Entry Title',
    audioUrl: 'https://example.com/audio.mp3',
    tags: ['tag1', 'tag2', 'tag3'],
    transcription: 'This is a test transcription of the audio entry.',
    aiResponse: 'This is the AI response to the audio entry.',
    createdAt: new Date('2023-12-01T10:30:00Z')
  };

  const mockOnDelete = jest.fn();
  const mockOnChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays all required entry fields', () => {
    render(
      <BlogEntryCard
        entry={mockEntry}
        onDelete={mockOnDelete}
        onChat={mockOnChat}
      />
    );

    // Verify title is displayed
    expect(screen.getByText('Test Entry Title')).toBeInTheDocument();

    // Verify date with time is displayed
    const dateText = screen.getByText(/Date:/);
    expect(dateText).toBeInTheDocument();
    expect(dateText.textContent).toContain('12/1/2023'); // Date part
    expect(dateText.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/); // Time part

    // Verify audio player is present
    const audioElement = screen.getByTestId('audio-player');
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute('src', 'https://example.com/audio.mp3');
    expect(audioElement).toHaveAttribute('controls');

    // Verify tags are displayed
    expect(screen.getByText('Tags: tag1, tag2, tag3')).toBeInTheDocument();

    // Verify transcription is displayed
    expect(screen.getByText('Transcription: This is a test transcription of the audio entry.')).toBeInTheDocument();

    // Verify AI response is displayed
    expect(screen.getByText('AI Response: This is the AI response to the audio entry.')).toBeInTheDocument();

    // Verify action buttons are present
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('handles empty tags array', () => {
    const entryWithNoTags = { ...mockEntry, tags: [] };
    
    render(
      <BlogEntryCard
        entry={entryWithNoTags}
        onDelete={mockOnDelete}
        onChat={mockOnChat}
      />
    );

    expect(screen.getByText('Tags:')).toBeInTheDocument();
  });

  it('displays date and time correctly for different timezones', () => {
    const entryWithDifferentDate = {
      ...mockEntry,
      createdAt: new Date('2023-06-15T14:45:30Z')
    };
    
    render(
      <BlogEntryCard
        entry={entryWithDifferentDate}
        onDelete={mockOnDelete}
        onChat={mockOnChat}
      />
    );

    const dateText = screen.getByText(/Date:/);
    expect(dateText).toBeInTheDocument();
    // Should contain both date and time components
    expect(dateText.textContent).toMatch(/Date: .+ .+/);
  });
});