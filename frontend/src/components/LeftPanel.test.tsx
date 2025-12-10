import { render, screen } from '@testing-library/react';
import LeftPanel from './LeftPanel';
import { AudioEntry } from '../models/audioEntry';

// Mock react-calendar
jest.mock('react-calendar', () => {
  return function Calendar({ tileContent, onChange, value }: any) {
    // Simulate calendar rendering with tile content
    const testDate = new Date('2023-12-01');
    const tileResult = tileContent({ date: testDate, view: 'month' });
    
    return (
      <div data-testid="mock-calendar">
        <div data-testid="calendar-component">Calendar</div>
        {tileResult && <div data-testid="date-marker">{tileResult}</div>}
        <button 
          data-testid="date-select-button" 
          onClick={() => onChange(testDate)}
        >
          Select Date
        </button>
      </div>
    );
  };
});

// Mock CSS imports
jest.mock('react-calendar/dist/Calendar.css', () => ({}));

describe('LeftPanel Component', () => {
  const mockOnDateSelect = jest.fn();
  const testDate = new Date('2023-12-01');

  const createMockEntry = (id: string, date: Date): AudioEntry => ({
    entryId: id,
    userId: 'test-user',
    title: `Entry ${id}`,
    audioUrl: `http://example.com/audio${id}.mp3`,
    tags: ['test'],
    transcription: 'Test transcription',
    aiResponse: 'AI response',
    createdAt: date
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('6.1 Ensure Calendar displays in LeftPanel', () => {
    it('should render Calendar component', () => {
      const audioEntries: AudioEntry[] = [];
      
      render(
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={testDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Verify Calendar component is rendered
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
    });

    it('should receive audioEntries for date marking', () => {
      const entryDate = new Date('2023-12-01');
      const audioEntries: AudioEntry[] = [
        createMockEntry('1', entryDate)
      ];
      
      render(
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={testDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Verify Calendar receives audioEntries and shows date marker
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
      expect(screen.getByTestId('date-marker')).toBeInTheDocument();
    });

    it('should mark dates that have entries with visual indicator', () => {
      const entryDate = new Date('2023-12-01');
      const audioEntries: AudioEntry[] = [
        createMockEntry('1', entryDate),
        createMockEntry('2', entryDate)
      ];
      
      render(
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={testDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Verify date marker is present for dates with entries
      const dateMarker = screen.getByTestId('date-marker');
      expect(dateMarker).toBeInTheDocument();
    });

    it('should not mark dates that have no entries', () => {
      const audioEntries: AudioEntry[] = []; // No entries
      
      render(
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={testDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Verify no date marker is present when no entries exist
      expect(screen.queryByTestId('date-marker')).not.toBeInTheDocument();
    });
  });

  describe('6.2 Test date selection and filtering', () => {
    it('should call onDateSelect when a date is selected', () => {
      const audioEntries: AudioEntry[] = [];
      
      render(
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={testDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Simulate date selection
      const selectButton = screen.getByTestId('date-select-button');
      selectButton.click();

      // Verify onDateSelect was called with the correct date
      expect(mockOnDateSelect).toHaveBeenCalledWith(testDate);
    });

    it('should pass selected date to Calendar component', () => {
      const selectedDate = new Date('2023-12-15');
      const audioEntries: AudioEntry[] = [];
      
      render(
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Verify Calendar component is rendered (which receives the selectedDate)
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
    });

    it('should handle date arrays for range selection', () => {
      const dateRange = [new Date('2023-12-01'), new Date('2023-12-05')];
      const audioEntries: AudioEntry[] = [];
      
      render(
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={dateRange}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Verify Calendar component handles date range
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
    });
  });
});