import React, { useState } from 'react';
import { Container, Button, Box, Typography } from '@mui/material';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Auth: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    setError(null); // Clear previous errors
    try {
      await signInWithPopup(auth, provider);
      console.log('Signed in with Google successfully!');
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  return (
    <Container maxWidth="xs">
      {showLogin ? <LoginForm /> : <SignUpForm />}
      <Box sx={{ mt: 2 }}>
        <Button onClick={() => setShowLogin(!showLogin)} fullWidth>
          {showLogin ? 'Need to sign up?' : 'Already have an account?'}
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button onClick={handleGoogleSignIn} fullWidth variant="outlined">
          Sign in with Google
        </Button>
        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error" align="center">
              Failed to edit, 0 occurrences found for old_string (import React, { useState } from 'react';
import { Container, Button, Box } from '@mui/material';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Auth: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log('Signed in with Google successfully!');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <Container maxWidth="xs">
      {showLogin ? <LoginForm /> : <SignUpForm />}
      <Box sx={{ mt: 2 }}>
        <Button onClick={() => setShowLogin(!showLogin)} fullWidth>
          {showLogin ? 'Need to sign up?' : 'Already have an account?'}
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button onClick={handleGoogleSignIn} fullWidth variant="outlined">
          Sign in with Google
        </Button>
      </Box>
    </Container>
  );
};

export default Auth;
). Original old_string was (import React, { useState } from 'react';
import { Container, Button, Box } from '@mui/material';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Auth: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log('Signed in with Google successfully!');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <Container maxWidth="xs">
      {showLogin ? <LoginForm /> : <SignUpForm />}
      <Box sx={{ mt: 2 }}>
        <Button onClick={() => setShowLogin(!showLogin)} fullWidth>
          {showLogin ? 'Need to sign up?' : 'Already have an account?'}
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button onClick={handleGoogleSignIn} fullWidth variant="outlined">
          Sign in with Google
        </Button>
      </Box>
    </Container>
  );
};

export default Auth;
) in /Users/tianzi/github/yara/speckit/frontend/src/pages/Auth.tsx. No edits made. The exact text in old_string was not found. Ensure you're not escaping content incorrectly and check whitespace, indentation, and context. Use read_file tool to verify.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Auth;
