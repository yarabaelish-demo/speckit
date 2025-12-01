import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AudioEntry } from '../models/audioEntry';
import SearchBar from '../components/SearchBar';

const Dashboard: React.FC = () => {
  const [audioEntries, setAudioEntries] = useState<AudioEntry[]>([]);
  const [searchResults, setSearchResults] = useState<AudioEntry[]>([]);

  useEffect(() => {
    const fetchAudioEntries = async () => {
      const querySnapshot = await getDocs(collection(db, "audioEntries"));
      const entries = querySnapshot.docs.map(doc => doc.data() as AudioEntry);
      setAudioEntries(entries);
    };

    fetchAudioEntries();
  }, []);

  const handleSearch = async (queryText: string) => {
    if (!queryText) {
      setSearchResults([]);
      return;
    }
    const searchQuery = query(collection(db, "audioEntries"), where("transcription", ">=", queryText), where("transcription", "<=", queryText + '\uf8ff'));
    const querySnapshot = await getDocs(searchQuery);
    const results = querySnapshot.docs.map(doc => doc.data() as AudioEntry);
    setSearchResults(results);
  };

  const entriesToDisplay = searchResults.length > 0 ? searchResults : audioEntries;

  return (
    <div>
      <h1>Dashboard</h1>
      <SearchBar onSearch={handleSearch} />
      {entriesToDisplay.map(entry => (
        <div key={entry.entryId}>
          <h2>{entry.title}</h2>
          <audio controls src={entry.audioUrl}></audio>
          <p>Tags: {entry.tags.join(', ')}</p>
          <p>Transcription: {entry.transcription}</p>
          <p>AI Response: {entry.aiResponse}</p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
