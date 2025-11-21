import React, { useState } from 'react';
import { Container, TextField, Button, Box, Typography } from '@mui/material';
import { getAuth } from 'firebase/auth';

const Upload: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!audioFile || !title) {
      setMessage('Please select an audio file and provide a title.');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setMessage('You must be logged in to upload audio.');
      return;
    }

    const formData = new FormData();
    formData.append('audioFile', audioFile);
    formData.append('title', title);
    formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim())));

    try {
      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Add Firebase ID token for authentication on the backend
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        setMessage('Audio uploaded successfully!');
        setAudioFile(null);
        setTitle('');
        setTags('');
      } else {
        const errorData = await response.text();
        setMessage(`Upload failed: ${errorData}`);
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      setMessage('An error occurred during upload.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Audio
      </Typography>
      <Box sx={{ mb: 2 }}>
        <input type="file" accept="audio/mp3" onChange={handleFileChange} />
      </Box>
      <TextField
        label="Title"
        variant="outlined"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        label="Tags (comma-separated)"
        variant="outlined"
        fullWidth
        margin="normal"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleUpload} fullWidth>
        Upload
      </Button>
      {message && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Container>
  );
};

export default Upload;
