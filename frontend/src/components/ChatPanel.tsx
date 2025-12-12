import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../apiConfig';

interface ChatPanelProps {
  entryId: string;
  initialMessage: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ entryId, initialMessage, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat with the AI's analysis as the first message
    setMessages([{ role: 'model', text: initialMessage }]);
  }, [initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistically add user message
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();

      // Prepare history for backend (excluding the very last user message we just added, 
      // effectively or including it? The backend expects history + new message usually, 
      // or full history. My backend impl takes `history` and `message`.
      // So history should be everything BEFORE the current message.
      const history = messages; 

      const response = await fetch(`${API_BASE_URL}/audio/${entryId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          history: history
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>AI Therapist</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Therapist'}:</strong>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && <div className="message model"><p>Thinking...</p></div>}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
};

export default ChatPanel;
