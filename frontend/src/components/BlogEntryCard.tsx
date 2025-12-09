import React from 'react';
import { AudioEntry } from '../models/audioEntry';

interface BlogEntryCardProps {
  entry: AudioEntry;
  onDelete: (entryId: string) => void;
  onChat: (entry: AudioEntry) => void;
}

const BlogEntryCard: React.FC<BlogEntryCardProps> = ({ entry, onDelete, onChat }) => {
  return (
    <div className="audio-entry-card">
      <h2>{entry.title}</h2>
      <p>Date: {entry.createdAt.toLocaleDateString()} {entry.createdAt.toLocaleTimeString()}</p>
      <audio controls src={entry.audioUrl}></audio>
      <p>Tags: {entry.tags.join(', ')}</p>
      <p>Transcription: {entry.transcription}</p>
      <p>AI Response: {entry.aiResponse}</p>
      <button 
        onClick={() => onChat(entry)} 
        style={{ 
          backgroundColor: '#1976d2', 
          color: 'white', 
          border: 'none', 
          padding: '5px 10px', 
          borderRadius: '5px', 
          cursor: 'pointer', 
          marginTop: '10px', 
          marginRight: '10px' 
        }}
      >
        Chat
      </button>
      <button 
        onClick={() => onDelete(entry.entryId)} 
        style={{ 
          backgroundColor: '#dc004e', 
          color: 'white', 
          border: 'none', 
          padding: '5px 10px', 
          borderRadius: '5px', 
          cursor: 'pointer', 
          marginTop: '10px' 
        }}
      >
        Delete
      </button>
    </div>
  );
};

export default BlogEntryCard;
