import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { AudioEntry } from '../../../backend/src/models/audioEntry'; // Assuming shared models
import SearchBar from '../components/SearchBar';

const Dashboard: React.FC = () => {
  const [audioEntries, setAudioEntries] = useState<AudioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const firestore = getFirestore();

  const fetchAudioEntries = async (searchQuery: string = '') => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const audioEntriesRef = collection(firestore, `personalData/${user.uid}/audioEntries`);
      let q = query(audioEntriesRef, where('userId', '==', user.uid));

      if (searchQuery) {
        // Note: Firestore does not support full-text search directly.
        // This will only work if 'transcription' field is an array of keywords or for exact matches.
        // For more advanced search, consider a dedicated search service (e.g., Algolia).
        q = query(q, where('transcription', 'array-contains', searchQuery.toLowerCase()));
      }

      const querySnapshot = await getDocs(q);

      const entries: AudioEntry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push({ ...doc.data() as Omit<AudioEntry, 'entryId'>, entryId: doc.id });
      });
      setAudioEntries(entries);
    } catch (error) {
      console.error('Error fetching audio entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudioEntries();
  }, [auth, firestore]);

  const handleSearch = (searchQuery: string) => {
    setLoading(true);
    fetchAudioEntries(searchQuery);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Your Audio Entries
      </Typography>
      <SearchBar onSearch={handleSearch} />
      {audioEntries.length === 0 ? (
        <Typography variant="body1">No audio entries yet. Upload one!</Typography>
      ) : (
        <List>
          {audioEntries.map((entry) => (
            <ListItem key={entry.entryId} divider>
              <ListItemText
                primary={entry.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textPrimary">
                      Tags: {entry.tags.join(', ')}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="textSecondary">
                      Transcription: {entry.transcription}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="textSecondary">
                      AI Response: {entry.aiResponse}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
};

export default Dashboard;
