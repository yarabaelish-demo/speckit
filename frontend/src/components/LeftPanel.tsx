import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { AudioEntry } from '../models/audioEntry';

interface LeftPanelProps {
  audioEntries: AudioEntry[];
  selectedDate: Date | Date[];
  onDateSelect: (date: Date | Date[] | null) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ 
  audioEntries, 
  selectedDate, 
  onDateSelect 
}) => {
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const hasEntry = audioEntries.some(entry => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate.getDate() === date.getDate() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getFullYear() === date.getFullYear()
        );
      });
      return hasEntry ? <p style={{ color: 'red', fontSize: '20px', margin: 0 }}>•</p> : null;
    }
    return null;
  };

  return (
    <div className="left-panel">
      <Calendar
        onChange={onDateSelect as any}
        value={selectedDate as any}
        tileContent={tileContent}
      />
    </div>
  );
};

export default LeftPanel;
