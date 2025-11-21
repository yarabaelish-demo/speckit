import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const auth = getAuth();
    setError(null); // Clear previous errors
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in successfully!');
    } catch (err: any) {
      console.error('Error logging in:', err);
      setError(err.message || 'Failed to log in.');
    }
  };

  return (
    <Container maxWidth="xs">
      <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
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
          Login
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

export default LoginForm;
