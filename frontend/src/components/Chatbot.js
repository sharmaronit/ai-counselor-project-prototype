import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Chatbot.css';
import { v4 as uuidv4 } from 'uuid';

// Use the correct prop name
export default function Chatbot({ onNewTextContent }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());

  useEffect(() => {
    setMessages([
      { role: 'assistant', content: 'Hello! How can I help you with your career goals today?' }
    ]);
  }, []);

 // ... (keep all the code above the handleSubmit function the same)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage = { role: 'user', content: currentMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentMessage('');
    setLoading(true);

    const history = newMessages.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('ai-counselor', {
        body: { query: userMessage.content, history: history, session_id: sessionId },
      });

      if (error) throw error;
      
      // =================================================================
      // === THE FIX: Add these lines to unescape the AI's response =====
      // =================================================================
      let formattedContent = data.reply;
      // Remove backslashes that escape asterisks (for bold/italics)
      formattedContent = formattedContent.replace(/\\\*/g, "*");
      // Remove backslashes that escape hashes (for headers)
      formattedContent = formattedContent.replace(/\\#/g, "#");
      // Remove backslashes that escape hyphens (for lists)
      formattedContent = formattedContent.replace(/\\-/g, "-");
      // =================================================================

      const assistantMessage = { role: 'assistant', content: formattedContent }; // Use the cleaned content
      setMessages([...newMessages, assistantMessage]);

      if (onNewTextContent) {
        onNewTextContent(userMessage.content + " " + assistantMessage.content);
      }
    } catch (error) {
      console.error("Error calling Edge Function:", error);
      const errorMessage = { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again." };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

// ... (keep all the code below the handleSubmit function the same)

  return (
    <div className="chatbot-container">
      <h3 className="widget-title">AI Counsellor</h3>
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="message assistant">Thinking...</div>}
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-input"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Ask me anything..."
          disabled={loading}
        />
        <button type="submit" className="send-button" disabled={loading}>Send</button>
      </form>
    </div>
  );
}