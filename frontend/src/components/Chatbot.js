import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct
import './Chatbot.css'; // Make sure this path is correct
import ReactMarkdown from 'react-markdown';

export default function Chatbot({ onNewTextContent }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    setMessages([
      { role: 'assistant', content: 'Hello! How can I help you with your career goals today?' }
    ]);
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = { role: 'user', content: currentMessage };
    setMessages(prevMessages => [...prevMessages, userMessage, { role: 'assistant', content: '' }]);
    setCurrentMessage('');
    setLoading(true);

    try {
      const functionUrl = 'https://peataenjmccoxachlihq.supabase.co/functions/v1/ai-counselor';
      
      // --- THIS IS THE FINAL FIX ---
      // Use the modern, asynchronous getSession() method to reliably get the auth token.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error("User is not authenticated. Cannot call function.");
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          query: userMessage.content,
          history: messages.filter(msg => msg.role !== 'assistant' || msg.content !== 'Hello! How can I help you with your career goals today?')
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      let accumulatedContent = '';
      const decoder = new TextDecoder();
      const reader = response.body.getReader();

      for await (const chunk of (async function*() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      })()) {
        const decodedChunk = decoder.decode(chunk, { stream: true });
        const lines = decodedChunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr.trim() === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices[0]?.delta?.content || '';
              accumulatedContent += delta;

              setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1].content = accumulatedContent;
                return updatedMessages;
              });
            } catch (error) {
              // Ignore malformed JSON
            }
          }
        }
      }

      if (onNewTextContent) {
          onNewTextContent(userMessage.content + " " + accumulatedContent);
      }

    } catch (error) {
      console.error("Error in handleSubmit:", error);
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