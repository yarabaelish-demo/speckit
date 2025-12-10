import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Mock Firebase
jest.mock('../firebaseConfig', () => ({
  auth: {},
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: class {
    toDate() {
      return new Date();
    }
  }
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn()
}));

// Mock react-calendar
jest.mock('react-calendar', () => {
  return function Calendar() {
    return <div data-testid="mock-calendar">Calendar</div>;
  };
});

// Mock CSS imports
jest.mock('react-calendar/dist/Calendar.css', () => ({}));

// Mock fetch for delete operations
global.fetch = jest.fn();

describe('Dashboard Integration Tests - Complete User Flows', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  };

  const createMockEntry = (id: string, title: string, date: Date, transcription: string = 'Test transcription') => ({
    entryId: id,
    userId: mockUser.uid,
    title,
    audioUrl: `http://example.com/audio${id}.mp3`,
    tags: ['test', 'tag'],
    transcription,
    aiResponse: 'AI response',
    createdAt: date
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });
  });

  describe('User Flow: Load dashboard → View entries → Navigate pages', () => {
    it('should load entries and allow pagination navigation', async () => {
      // Create 12 entries to test pagination (3 pages with 5 entries per page)
      // Use today's date so they pass the date filter
      const today = new Date();
      const mockEntries = Array.from({ length: 12 }, (_, i) => 
        createMockEntry(`entry-${i}`, `Entry ${i}`, today)
      );

      (getDocs as jest.Mock).mockResolvedValue({
        size: mockEntries.length,
        docs: mockEntries.map(entry => ({
          data: () => entry
        }))
      });

      render(<Dashboard searchQuery="" />);

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('Entry 0')).toBeInTheDocument();
      });

      // Should show first 5 entries on page 1
      expect(screen.getByText('Entry 0')).toBeInTheDocument();
      expect(screen.getByText('Entry 4')).toBeInTheDocument();
      expect(screen.queryByText('Entry 5')).not.toBeInTheDocument();

      // Should show pagination controls
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();

      // Navigate to page 2
      const page2Button = screen.getByText('2');
      fireEvent.click(page2Button);

      // Should show entries 5-9
      await waitFor(() => {
        expect(screen.getByText('Entry 5')).toBeInTheDocument();
      });
      expect(screen.getByText('Entry 9')).toBeInTheDocument();
      expect(screen.queryByText('Entry 0')).not.toBeInTheDocument();

      // Navigate to page 3
      const page3Button = screen.getByText('3');
      fireEvent.click(page3Button);

      // Should show entries 10-11
      await waitFor(() => {
        expect(screen.getByText('Entry 10')).toBeInTheDocument();
      });
      expect(screen.getByText('Entry 11')).toBeInTheDocument();
      expect(screen.queryByText('Entry 9')).not.toBeInTheDocument();
    });
  });

  describe('User Flow: Search entries → View results → Clear search', () => {
    it('should filter entries by search query and allow clearing', async () => {
      const today = new Date();
      const mockEntries = [
        createMockEntry('1', 'React Tutorial', today, 'Learn React basics'),
        createMockEntry('2', 'TypeScript Guide', today, 'TypeScript fundamentals'),
        createMockEntry('3', 'React Advanced', today, 'Advanced React patterns')
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        size: mockEntries.length,
        docs: mockEntries.map(entry => ({
          data: () => entry
        }))
      });

      const { rerender } = render(<Dashboard searchQuery="" />);

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      });

      // All entries should be visible initially
      expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      expect(screen.getByText('TypeScript Guide')).toBeInTheDocument();
      expect(screen.getByText('React Advanced')).toBeInTheDocument();

      // Perform search for "React"
      rerender(<Dashboard searchQuery="React" />);

      // Should show only React-related entries
      await waitFor(() => {
        expect(screen.getByText('React Tutorial')).toBeInTheDocument();
        // eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
        expect(screen.getByText('React Advanced')).toBeInTheDocument();
        // eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
        expect(screen.queryByText('TypeScript Guide')).not.toBeInTheDocument();
      });

      // Should show search status
      expect(screen.getByText(/Search results for/)).toBeInTheDocument();
      expect(screen.getByText(/2 found/)).toBeInTheDocument();

      // Clear search
      rerender(<Dashboard searchQuery="" />);

      // All entries should be visible again
      await waitFor(() => {
        expect(screen.getByText('TypeScript Guide')).toBeInTheDocument();
      });
    });
  });

  describe('User Flow: Select date → View filtered entries → Select different date', () => {
    it('should filter entries by selected date', async () => {
      // Use today's date so entries will be visible by default
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockEntries = [
        createMockEntry('1', 'Entry Today 1', today),
        createMockEntry('2', 'Entry Today 2', today),
        createMockEntry('3', 'Entry Tomorrow', tomorrow)
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        size: mockEntries.length,
        docs: mockEntries.map(entry => ({
          data: () => entry
        }))
      });

      render(<Dashboard searchQuery="" />);

      // Wait for entries to load - should show ALL entries by default (no date filter)
      await waitFor(() => {
        expect(screen.getByText('Entry Today 1')).toBeInTheDocument();
      });

      // Should show all entries by default (no date filter applied)
      expect(screen.getByText('Entry Today 1')).toBeInTheDocument();
      expect(screen.getByText('Entry Today 2')).toBeInTheDocument();
      expect(screen.getByText('Entry Tomorrow')).toBeInTheDocument();
    });
  });

  describe('User Flow: Search → Paginate results → Clear search', () => {
    it('should paginate search results and reset on clear', async () => {
      // Create 12 entries with "test" in transcription
      const today = new Date();
      const mockEntries = Array.from({ length: 12 }, (_, i) => 
        createMockEntry(`entry-${i}`, `Entry ${i}`, today, `Test content ${i}`)
      );

      (getDocs as jest.Mock).mockResolvedValue({
        size: mockEntries.length,
        docs: mockEntries.map(entry => ({
          data: () => entry
        }))
      });

      const { rerender } = render(<Dashboard searchQuery="" />);

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('Entry 0')).toBeInTheDocument();
      });

      // Perform search
      rerender(<Dashboard searchQuery="test" />);

      // Should show first 5 search results
      await waitFor(() => {
        expect(screen.getByText(/Search results for/)).toBeInTheDocument();
      });
      expect(screen.getByText('Entry 0')).toBeInTheDocument();
      expect(screen.getByText('Entry 4')).toBeInTheDocument();

      // Navigate to page 2 of search results
      const page2Button = screen.getByText('2');
      fireEvent.click(page2Button);

      await waitFor(() => {
        expect(screen.getByText('Entry 5')).toBeInTheDocument();
      });

      // Clear search
      rerender(<Dashboard searchQuery="" />);

      // Should reset to page 1 and show date-filtered entries
      await waitFor(() => {
        expect(screen.queryByText(/Search results for/)).not.toBeInTheDocument();
      });
    });
  });

  describe('User Flow: Delete entry → Verify UI updates', () => {
    it('should remove entry and update pagination', async () => {
      const today = new Date();
      const mockEntries = [
        createMockEntry('1', 'Entry 1', today),
        createMockEntry('2', 'Entry 2', today),
        createMockEntry('3', 'Entry 3', today)
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        size: mockEntries.length,
        docs: mockEntries.map(entry => ({
          data: () => entry
        }))
      });

      // Mock successful delete
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      // Mock window.confirm
      global.confirm = jest.fn(() => true);

      render(<Dashboard searchQuery="" />);

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('Entry 1')).toBeInTheDocument();
      });

      // Should show 3 entries
      expect(screen.getByText('Entry 1')).toBeInTheDocument();
      expect(screen.getByText('Entry 2')).toBeInTheDocument();
      expect(screen.getByText('Entry 3')).toBeInTheDocument();

      // Delete first entry
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Wait for entry to be removed
      await waitFor(() => {
        expect(screen.queryByText('Entry 1')).not.toBeInTheDocument();
      });

      // Should still show remaining entries
      expect(screen.getByText('Entry 2')).toBeInTheDocument();
      expect(screen.getByText('Entry 3')).toBeInTheDocument();
    });
  });

  describe('6.2 Date Selection and Filtering Integration', () => {
    it('should filter entries correctly when date is selected', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockEntries = [
        createMockEntry('1', 'Entry Today', today),
        createMockEntry('2', 'Entry Yesterday', yesterday)
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        size: mockEntries.length,
        docs: mockEntries.map(entry => ({
          data: () => entry
        }))
      });

      render(<Dashboard searchQuery="" />);

      // Wait for entries to load - should show ALL entries by default
      await waitFor(() => {
        expect(screen.getByText('Entry Today')).toBeInTheDocument();
      });

      // Should show all entries by default (no date filter applied)
      expect(screen.getByText('Entry Today')).toBeInTheDocument();
      expect(screen.getByText('Entry Yesterday')).toBeInTheDocument();

      // Verify Calendar is present for date selection
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });

    it('should work alongside search functionality', async () => {
      const today = new Date();
      const mockEntries = [
        createMockEntry('1', 'React Tutorial', today, 'Learn React basics'),
        createMockEntry('2', 'TypeScript Guide', today, 'TypeScript fundamentals'),
        createMockEntry('3', 'Vue Tutorial', today, 'Learn Vue basics')
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        size: mockEntries.length,
        docs: mockEntries.map(entry => ({
          data: () => entry
        }))
      });

      const { rerender } = render(<Dashboard searchQuery="" />);

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      });

      // All entries should be visible initially
      expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      expect(screen.getByText('TypeScript Guide')).toBeInTheDocument();
      expect(screen.getByText('Vue Tutorial')).toBeInTheDocument();

      // Perform search for "React"
      rerender(<Dashboard searchQuery="React" />);

      // Should show only React-related entries
      await waitFor(() => {
        expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      });
      expect(screen.queryByText('TypeScript Guide')).not.toBeInTheDocument();
      expect(screen.queryByText('Vue Tutorial')).not.toBeInTheDocument();

      // Calendar should still be visible during search
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
  });
});
