import React from 'react';

interface SearchStatusProps {
  isSearching: boolean;
  searchQuery: string;
  resultCount: number;
  onClearSearch: () => void;
}

const SearchStatus: React.FC<SearchStatusProps> = ({ 
  isSearching, 
  searchQuery, 
  resultCount, 
  onClearSearch 
}) => {
  // Hide component when not searching
  if (!isSearching) {
    return null;
  }

  return (
    <div 
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        {resultCount === 0 ? (
          <p style={{ margin: 0 }}>
            No entries match '<strong>{searchQuery}</strong>'
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Search results for '<strong>{searchQuery}</strong>' ({resultCount} found)
          </p>
        )}
      </div>
      <button
        onClick={onClearSearch}
        aria-label={`Clear search for ${searchQuery}`}
        style={{
          padding: '5px 15px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Clear Search
      </button>
    </div>
  );
};

export default SearchStatus;
