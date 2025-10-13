'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, MapPin, DollarSign, Mail, ExternalLink, FileText, Linkedin } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      // Add assistant response with candidates
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        candidates: data.candidates || [],
        output: data.output
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        error: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto ${hasMessages ? 'pb-4' : 'flex items-center justify-center'}`}>
        {!hasMessages ? (
          // Empty state - centered input
          <div className="w-full max-w-3xl px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                How can I help you today?
              </h1>
              <p className="text-gray-600">
                Ask me about candidates and I'll find the best matches for you.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-4 pr-12 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        ) : (
          // Messages view
          <div className="max-w-6xl mx-auto w-full px-4 pt-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-6 ${
                  message.role === 'user' ? 'flex justify-end' : ''
                }`}
              >
                {message.role === 'user' ? (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ) : (
                  <div className="w-full">
                    {message.error ? (
                      <div className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 max-w-[80%]">
                        <p>{message.error}</p>
                      </div>
                    ) : message.candidates && message.candidates.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-gray-700 font-semibold text-lg mb-4">
                          Found {message.candidates.length} candidate{message.candidates.length > 1 ? 's' : ''}
                        </p>
                        <div className="grid gap-4">
                          {message.candidates.map((candidate, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
                            >
                              {/* Header with Name */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="text-white" size={24} />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                      {candidate.name}
                                    </h3>
                                    {candidate.email && (
                                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                                        <Mail size={14} />
                                        <span>{candidate.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                {candidate.country && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                    <span>{candidate.country}</span>
                                  </div>
                                )}
                                
                                {candidate.desired_rate && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <DollarSign size={16} className="text-gray-400 flex-shrink-0" />
                                    <span>{candidate.desired_rate}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Bio */}
                              {candidate.candidate_bio && (
                                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                                  {candidate.candidate_bio}
                                </p>
                              )}
                              
                              {/* Action Links */}
                              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                {candidate.profile_url && (
                                  <a
                                    href={candidate.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                                  >
                                    <ExternalLink size={14} />
                                    View Profile
                                  </a>
                                )}
                                
                                {candidate.resume_link && (
                                 <a 
                                    href={candidate.resume_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                  >
                                    <FileText size={14} />
                                    Resume
                                  </a>
                                )}
                                
                                {candidate.linkedin_link && (
                                  <a
                                    href={candidate.linkedin_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                  >
                                    <Linkedin size={14} />
                                    LinkedIn
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                        <p>No candidates found for your query.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="mb-6">
                <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Bottom (shown when there are messages) */}
      {hasMessages && (
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}