import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Make sure this path is correct for your project
import './Chatbot.css'; // Make sure this path is correct for your project
import ReactMarkdown from 'react-markdown';

// --- THIS IS THE FIX ---
// Ensure the component is exported as the default export for your application to find it.
export default function Chatbot({ onNewTextContent }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);

  // Set the initial greeting message when the component loads
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
      // Use the direct URL to your Supabase Function for maximum reliability
      const functionUrl = 'https://peataenjmccoxachlihq.supabase.co/functions/v1/ai-counselor';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          // OpenRouter does not require the Supabase Auth header, just Content-Type
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          // Filter out the initial greeting to prevent history errors with the AI model
          history: messages.filter(msg => msg.role !== 'assistant' || msg.content !== 'Hello! How can I help you with your career goals today?')
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
      }
      
      // Use a robust method for reading the stream from the response
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

              // Update the very last message in the array with the new content in real-time
              setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1].content = accumulatedContent;
                return updatedMessages;
              });
            } catch (error) {
              // Ignore malformed JSON that can happen with partial stream chunks
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