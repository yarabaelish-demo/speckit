import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import SearchBar from './SearchBar';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

const Header: React.FC<HeaderProps> = ({ onSearch, searchQuery }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
      setShowDropdown(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getInitials = (email: string | null | undefined) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <nav className="nav-left">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/upload">Upload</Link></li>
          </ul>
        </nav>
        
        {onSearch && (
          <div className="header-search">
            <SearchBar onSearch={onSearch} initialQuery={searchQuery} />
          </div>
        )}
        
        <div className="nav-right">
          {user ? (
            <div className="profile-container" ref={dropdownRef}>
              <div 
                className="profile-icon" 
                onClick={() => setShowDropdown(!showDropdown)}
                title={user.email || 'User'}
              >
                {getInitials(user.email)}
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item user-email">{user.email}</div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="login-link">Login / Sign Up</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;