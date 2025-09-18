  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = { role: 'user', content: currentMessage };
    setMessages(prevMessages => [...prevMessages, userMessage, { role: 'assistant', content: '' }]);
    setCurrentMessage('');
    setLoading(true);

    try {
      const functionUrl = 'https://peataenjmccoxachlihq.supabase.co/functions/v1/ai-counselor';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          history: messages.filter(msg => msg.role !== 'assistant' || msg.content !== 'Hello! How can I help you with your career goals today?')
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
      }

      // --- NEW, MORE ROBUST STREAM HANDLING ---
      let accumulatedContent = '';
      // The TextDecoder needs to be outside the loop
      const decoder = new TextDecoder();
      const reader = response.body.getReader();

      // Use a for-await-of loop which is cleaner and more modern
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
              // Ignore malformed JSON from partial chunks
            }
          }
        }
      }
      // --- END OF NEW STREAM HANDLING ---

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