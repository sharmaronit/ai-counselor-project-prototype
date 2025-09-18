  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = { role: 'user', content: currentMessage };
    setMessages(prevMessages => [...prevMessages, userMessage, { role: 'assistant', content: '' }]);
    setCurrentMessage('');
    setLoading(true);

    try {
      // The direct URL to your Supabase Function
      const functionUrl = 'https://peataenjmccoxachlihq.supabase.co/functions/v1/ai-counselor';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          // --- THIS IS THE FIX ---
          // We only need to tell the server we are sending JSON.
          // The OpenRouter function does not need the Supabase Auth header.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          history: messages.filter(msg => msg.role !== 'assistant' || msg.content !== 'Hello! How can I help you with your career goals today?')
        }),
      });

      if (!response.ok) {
        // This will now give us a more specific error if the server fails
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
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
      console.error("Error in handleSubmit:", error); // More detailed console error
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