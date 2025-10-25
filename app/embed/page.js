'use client';

import { useState } from 'react';

// Dedicated embed page - SOLO CHAT, sin layout principal
export default function EmbedChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente especializado en cannabis de Selva. ¿En qué puedo ayudarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const baseURL = window.location.origin;
      const response = await fetch(`${baseURL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
  message: userMessage.content, 
  conversation: messages 
})
      });

      const data = await response.json();
      
      if (data.answer) {
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: data.answer
  }]);
}
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error. ¿Puedes intentar de nuevo?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        #selva-chat-button { display: none !important; }
        body { 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, sans-serif;
          overflow: hidden;
          height: 100vh;
          height: 100dvh;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-0.25rem); }
          60% { transform: translateY(-0.125rem); }
        }
        
        @media (max-width: 480px) {
          .chat-container {
            height: 100vh !important;
            height: 100dvh !important;
          }
        }
      `}</style>
      
      <div 
        className="chat-container"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh',
          height: '100dvh',
          backgroundColor: 'white',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}>
        
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 0.5rem',
          background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
          paddingBottom: '0.5rem'
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  maxWidth: '300px',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: message.role === 'user' ? '#16a34a' : 'white',
                  color: message.role === 'user' ? 'white' : '#1f2937',
                  boxShadow: message.role === 'user' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: message.role === 'user' ? 'none' : '1px solid #dcfce7'
                }}
              >
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  whiteSpace: 'pre-wrap' 
                }}>
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                backgroundColor: 'white',
                color: '#1f2937',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #dcfce7'
              }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: '#16a34a',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite'
                  }}></div>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: '#16a34a',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite',
                    animationDelay: '0.1s'
                  }}></div>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: '#16a34a',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite',
                    animationDelay: '0.2s'
                  }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input fijo abajo */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          padding: '1rem',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            🌿 Asistente Cannabis Selva
          </div>
          <form onSubmit={handleSubmit} style={{ 
            display: 'flex', 
            gap: '0.5rem',
            alignItems: 'stretch'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre cannabis..."
              style={{
                flex: 1,
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '16px',
                outline: 'none',
                minHeight: '44px'
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}// Updated Fri Oct 24 08:53:00 MST 2025
