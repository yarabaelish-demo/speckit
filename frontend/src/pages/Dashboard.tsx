import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AudioEntry } from '../models/audioEntry';
import ChatPanel from '../components/ChatPanel';
import LeftPanel from '../components/LeftPanel';
import RightPanel from '../components/RightPanel';

interface DashboardProps {
  searchQuery?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ searchQuery = '' }) => {
  const [audioEntries, setAudioEntries] = useState<AudioEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | Date[]>(new Date());
  const [activeChatEntry, setActiveChatEntry] = useState<AudioEntry | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const entriesPerPage = 5;

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

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
    setIsSearching(searchQuery.trim().length > 0);
  }, [searchQuery]);

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

  const handleDateChange = (newDate: Date | Date[]) => {
    setDate(newDate);
    setCurrentPage(1); // Reset to page 1 when date filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearSearch = () => {
    // This will be handled by the parent component (App) that manages searchQuery
    // For now, we just update the local state
    setIsSearching(false);
    setCurrentPage(1);
  };

  const handleChat = (entry: AudioEntry) => {
    setActiveChatEntry(entry);
  };

  const getFilteredEntries = () => {
    let filtered = audioEntries;

    // Apply search filter if query exists
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(entry => 
        entry.transcription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      // Sort search results by createdAt descending (newest first)
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return filtered;
    }
    
    // Filter by selected date when not searching
    const selectedDate = Array.isArray(date) ? date[0] : date;
    return filtered.filter(entry => {
      const entryDate = entry.createdAt;
      return (
        entryDate.getDate() === selectedDate.getDate() &&
        entryDate.getMonth() === selectedDate.getMonth() &&
        entryDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const filteredEntries = getFilteredEntries();
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  // Calculate start and end indices for pagination
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  // Slice entries for current page, handling edge cases
  const entriesToDisplay = filteredEntries.length > 0 
    ? filteredEntries.slice(startIndex, endIndex)
    : [];

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in to view your dashboard.</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="dashboard-container">
        <LeftPanel
          audioEntries={audioEntries}
          selectedDate={date}
          onDateSelect={handleDateChange}
        />
        <RightPanel
          entries={entriesToDisplay}
          totalFilteredCount={filteredEntries.length}
          currentPage={currentPage}
          entriesPerPage={entriesPerPage}
          totalPages={totalPages}
          isSearching={isSearching}
          searchQuery={searchQuery}
          hasAnyEntries={audioEntries.length > 0}
          isDateFiltered={!isSearching}
          onPageChange={handlePageChange}
          onClearSearch={handleClearSearch}
          onDelete={handleDelete}
          onChat={handleChat}
        />
      </div>
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
