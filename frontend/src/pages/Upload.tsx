import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { API_BASE_URL } from '../apiConfig';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'; // Safari
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else {
        // Fallback, let browser decide or try wav if supported (rare for MediaRecorder direct)
        console.warn("Common audio mime types not supported, letting browser choose default.");
        mimeType = ''; 
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || mediaRecorder.mimeType });
        // Create a File object from the Blob
        const extension = mimeType.split('/')[1] || 'webm'; // Default extension
        const recordedFile = new File([blob], `recording.${extension}`, { type: mimeType || mediaRecorder.mimeType });
        setFile(recordedFile);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Please select a file to upload or record audio.");
      return;
    }
    if (!user) {
      setError("You must be logged in to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', title || 'Untitled Recording'); // Default title if empty
    formData.append('tags', tags);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/audio/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('File uploaded successfully!');
        setTitle('');
        setTags('');
        setFile(null);
        navigate('/dashboard');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Error uploading file.');
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  if (!user) {
      return <p>Please log in to upload audio.</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Upload or Record Audio</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <div style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h3>Option 1: Record Audio</h3>
        {!isRecording ? (
          <button type="button" onClick={startRecording} style={{ backgroundColor: '#1976d2', color: 'white' }}>
            Start Recording
          </button>
        ) : (
          <button type="button" onClick={stopRecording} style={{ backgroundColor: '#dc004e', color: 'white' }}>
            Stop Recording ({formatTime(recordingTime)})
          </button>
        )}
      </div>

      <div style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h3>Option 2: Upload File</h3>
        <input type="file" onChange={handleFileChange} accept="audio/*" disabled={isRecording} />
      </div>

      {file && (
        <div style={{ marginBottom: '10px', color: 'green' }}>
          <strong>Selected File:</strong> {file.name}
        </div>
      )}

      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      
      <button type="submit" disabled={isRecording}>Upload</button>
    </form>
  );
};

export default Upload;