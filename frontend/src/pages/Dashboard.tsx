import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AudioEntry } from '../models/audioEntry';
import SearchBar from '../components/SearchBar';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ChatPanel from '../components/ChatPanel';

const Dashboard: React.FC = () => {
  const [audioEntries, setAudioEntries] = useState<AudioEntry[]>([]);
  const [searchResults, setSearchResults] = useState<AudioEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | Date[]>(new Date());
  const [isSearching, setIsSearching] = useState(false);
  const [activeChatEntry, setActiveChatEntry] = useState<AudioEntry | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchAudioEntries(currentUser.uid);
      } else {
        setAudioEntries([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchAudioEntries = async (uid: string) => {
    try {
      console.log("Fetching entries for user:", uid);
      const querySnapshot = await getDocs(collection(db, `users/${uid}/audioEntries`));
      console.log("Entries found:", querySnapshot.size);
      const entries = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to JS Date
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt);
        return { ...data, createdAt } as AudioEntry;
      });
      setAudioEntries(entries);
    } catch (error) {
      console.error("Error fetching audio entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (queryText: string) => {
    if (!queryText) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    console.log("Searching for:", queryText);

    // Client-side filtering
    const results = audioEntries.filter(entry => 
      entry.transcription.toLowerCase().includes(queryText.toLowerCase()) ||
      entry.title.toLowerCase().includes(queryText.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(queryText.toLowerCase()))
    );

    console.log("Search results found:", results.length);

    // Sort results by createdAt descending (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    setSearchResults(results);
  };

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/api/audio/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAudioEntries(prev => prev.filter(entry => entry.entryId !== entryId));
        setSearchResults(prev => prev.filter(entry => entry.entryId !== entryId));
        alert("Entry deleted successfully.");
      } else {
        const errData = await response.json();
        alert(`Error deleting entry: ${errData.error}`);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("An error occurred while deleting the entry.");
    }
  };

  const getFilteredEntries = () => {
    if (isSearching) {
      return searchResults;
    }
    
    // Filter by selected date
    const selectedDate = Array.isArray(date) ? date[0] : date;
    return audioEntries.filter(entry => {
      const entryDate = entry.createdAt;
      return (
        entryDate.getDate() === selectedDate.getDate() &&
        entryDate.getMonth() === selectedDate.getMonth() &&
        entryDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const entriesToDisplay = getFilteredEntries();

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const hasEntry = audioEntries.some(entry => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate.getDate() === date.getDate() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getFullYear() === date.getFullYear()
        );
      });
      return hasEntry ? <p style={{ color: 'red', fontSize: '20px', margin: 0 }}>•</p> : null;
    }
    return null;
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in to view your dashboard.</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <Calendar
          onChange={setDate as any}
          value={date as any}
          tileContent={tileContent}
        />
      </div>
      <SearchBar onSearch={handleSearch} />
      {entriesToDisplay.length === 0 ? (
        <p>No entries found for this date or search.</p>
      ) : (
        entriesToDisplay.map(entry => (
          <div key={entry.entryId} className="audio-entry-card">
            <h2>{entry.title}</h2>
            <p>Date: {entry.createdAt.toLocaleDateString()} {entry.createdAt.toLocaleTimeString()}</p>
            <audio controls src={entry.audioUrl}></audio>
            <p>Tags: {entry.tags.join(', ')}</p>
            <p>Transcription: {entry.transcription}</p>
            <p>AI Response: {entry.aiResponse}</p>
            <button onClick={() => setActiveChatEntry(entry)} style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px', marginRight: '10px' }}>Chat</button>
            <button onClick={() => handleDelete(entry.entryId)} style={{ backgroundColor: '#dc004e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>Delete</button>
          </div>
        ))
      )}
      {activeChatEntry && (
        <ChatPanel
          entryId={activeChatEntry.entryId}
          initialMessage={activeChatEntry.aiResponse || "Hello, I'm here to listen."}
          onClose={() => setActiveChatEntry(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
