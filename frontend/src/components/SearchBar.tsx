import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch} className="search-form" role="search">
      <label htmlFor="search-input" className="sr-only">
        Search audio entries
      </label>
      <input
        id="search-input"
        type="text"
        placeholder="Search transcriptions..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
        aria-label="Search audio entries by transcription, title, or tags"
        aria-describedby="search-help"
      />
      <span id="search-help" className="sr-only">
        Enter keywords to search through your audio journal entries
      </span>
      <button type="submit" className="search-button" aria-label="Submit search">
        Search
      </button>
    </form>
  );
};

export default SearchBar;