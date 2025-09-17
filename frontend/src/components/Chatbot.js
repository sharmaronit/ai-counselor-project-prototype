import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct
import './Chatbot.css'; // Make sure this path is correct
import ReactMarkdown from 'react-markdown';

export default function Chatbot({ onNewTextContent }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);

  // Set the initial greeting message
  useEffect(() => {
    setMessages([
      { role: 'assistant', content: 'Hello! How can I help you with your career goals today?' }
    ]);
  }, []);

  // Automatically scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = { role: 'user', content: currentMessage };
    // Add the user's message and a new, empty assistant message to be populated by the stream
    setMessages(prevMessages => [...prevMessages, userMessage, { role: 'assistant', content: '' }]);
    setCurrentMessage('');
    setLoading(true);

    try {
      // --- IMPORTANT ---
      // This is the direct URL to your Supabase Function.
      // This bypasses potential browser errors and is more reliable.
      const functionUrl = 'https://peataenjmccoxachlihq.supabase.co/functions/v1/ai-counselor'; // Replace with your actual URL if different

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass the user's authentication token to the function
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
        },
        body: JSON.stringify({
          query: userMessage.content,
          // Filter out the initial greeting to prevent history errors
          history: messages.filter(msg => msg.role !== 'assistant' || msg.content !== 'Hello! How can I help you with your career goals today?')
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read the response as a stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr.trim() === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices[0]?.delta?.content || '';
              accumulatedContent += delta;

              // Update the very last message in the array with the new content
              setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1].content = accumulatedContent;
                return updatedMessages;
              });
            } catch (error) {
              // Ignore lines that are not valid JSON
            }
          }
        }
      }

      if (onNewTextContent) {
          onNewTextContent(userMessage.content + " " + accumulatedContent);
      }

    } catch (error) {
      console.error("Error calling Edge Function:", error);
      const errorMessage = "Sorry, I'm having trouble connecting. Please try again.";
      setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1].content = errorMessage;
          return updatedMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h3 className="widget-title">AI Counsellor</h3>
      <div className="chat-history" ref={chatHistoryRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
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