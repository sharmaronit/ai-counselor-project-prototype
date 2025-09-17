import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Chatbot.css';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';

export default function Chatbot({ onNewTextContent }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    setMessages([
      { role: 'assistant', content: 'Hello! How can I help you with your career goals today?' }
    ]);
  }, []);

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = { role: 'user', content: currentMessage };
    // Add the user message and an empty assistant message to be populated
    const newMessages = [...messages, userMessage, { role: 'assistant', content: '' }];
    setMessages(newMessages);
    setCurrentMessage('');
    setLoading(true);

    try {
      const { data: { functionUrl } } = await supabase.functions.get('ai-counselor');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
        },
        body: JSON.stringify({
          query: userMessage.content,
          history: messages.slice(1) // Send previous messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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

              // Update the last message (the empty assistant one) with the new content
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
      // Call the prop after the full stream is complete
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