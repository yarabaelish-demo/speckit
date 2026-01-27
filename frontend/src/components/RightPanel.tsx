import React from 'react';
import { AudioEntry } from '../models/audioEntry';
import SearchStatus from './SearchStatus';
import BlogEntryCard from './BlogEntryCard';
import PaginationControls from './PaginationControls';

interface RightPanelProps {
  entries: AudioEntry[];
  totalFilteredCount: number;
  currentPage: number;
  entriesPerPage: number;
  totalPages: number;
  isSearching: boolean;
  searchQuery: string;
  hasAnyEntries: boolean;
  isDateFiltered: boolean;
  onPageChange: (page: number) => void;
  onClearSearch: () => void;
  onDelete: (entryId: string) => void;
  onChat: (entry: AudioEntry) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  entries,
  totalFilteredCount,
  currentPage,
  entriesPerPage,
  totalPages,
  isSearching,
  searchQuery,
  hasAnyEntries,
  isDateFiltered,
  onPageChange,
  onClearSearch,
  onDelete,
  onChat
}) => {
  // Determine which empty state message to show
  const getEmptyStateMessage = () => {
    if (!hasAnyEntries) {
      return "No entries available";
    }
    if (isSearching && totalFilteredCount === 0) {
      // SearchStatus component will handle this message
      return null;
    }
    if (isDateFiltered && totalFilteredCount === 0) {
      return "No entries for this date";
    }
    return null;
  };

  const emptyMessage = getEmptyStateMessage();

  return (
    <div className="right-panel">
      <SearchStatus
        isSearching={isSearching}
        searchQuery={searchQuery}
        resultCount={totalFilteredCount}
        onClearSearch={onClearSearch}
      />
      
      {entries.length === 0 && emptyMessage ? (
        <div className="empty-state-message">
          <p>{emptyMessage}</p>
        </div>
      ) : entries.length > 0 ? (
        <>
          {entries.map(entry => (
            <BlogEntryCard
              key={entry.entryId}
              entry={entry}
              onDelete={onDelete}
              onChat={onChat}
            />
          ))}
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </div>
  );
};

export default RightPanel;
