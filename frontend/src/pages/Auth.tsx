import React from 'react';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';

const Auth: React.FC = () => {
  return (
    <div>
      <h1>Authentication</h1>
      <SignUpForm />
      <LoginForm />
    </div>
  );
};

export default Auth;