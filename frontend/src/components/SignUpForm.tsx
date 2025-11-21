import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const SignUpForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    const auth = getAuth();
    setError(null); // Clear previous errors
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signed up successfully!');
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to sign up.');
    }
  };

  return (
    <Container maxWidth="xs">
      <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Sign Up
        </Button>
        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        )}
      </form>
    </Container>
  );
};

export default SignUpForm;
