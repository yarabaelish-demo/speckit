import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Router>
      <div className="App">
        <Header onSearch={handleSearch} searchQuery={searchQuery} />
        <main>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard searchQuery={searchQuery} onClearSearch={handleClearSearch} />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/" element={<Dashboard searchQuery={searchQuery} onClearSearch={handleClearSearch} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;