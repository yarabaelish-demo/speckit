import React from 'react';

const Header: React.FC = () => {
  return (
    <header>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/auth">Login/Sign Up</a></li>
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/upload">Upload</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;