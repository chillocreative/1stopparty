import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const MembersAnalysis = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Set minimum loading time of 5 seconds
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 5000);

    // Load all data
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchUserData(),
          fetchDashboardData(),
          checkApiConfiguration()
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setDataLoaded(true); // Still proceed even if there are errors
      }
    };

    loadAllData();

    return () => clearTimeout(minLoadingTimer);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle loading completion when both minimum time and data loading are done
  useEffect(() => {
    if (!minLoadingTime && dataLoaded) {
      setLoading(false);
    }
  }, [minLoadingTime, dataLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success) {
          setUser(userData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
    // Note: Loading state will be controlled by minLoadingTime
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch member-specific dashboard analytics
      const response = await fetch('/api/members/dashboard-analytics', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching member dashboard data:', error);
    }
  };

  const checkApiConfiguration = async () => {
    try {
      const response = await fetch('/api/ai-settings/check', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setApiConfigured(data.success && data.configured);
        
        if (data.success && data.configured) {
          // Add welcome message
          setMessages([{
            id: Date.now(),
            role: 'assistant',
            content: `Salam sejahtera! Saya robot MADANI. Saya boleh bantu analisa data dan menjawab sebarang soalan berkenaan data dari dashboard. Sila ajukan soalan?`,
            timestamp: new Date()
          }]);
        } else if (data.configured && !data.success) {
          // API is configured but not working
          setMessages([{
            id: Date.now(),
            role: 'assistant',
            content: `⚠️ **API Connection Issue**\n\nYour Deepseek API is configured but I'm having trouble connecting to it. ${data.message || 'Please check your API settings and try again.'}\n\n[Check API Settings](/members/api-settings)`,
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Error checking API configuration:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    setStreamingMessage('');

    if (enableStreaming) {
      // Use streaming API
      try {
        abortControllerRef.current = new AbortController();
        
        const response = await fetch('/api/ai-analysis/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            message: userMessage.content,
            dashboard_data: dashboardData,
            context: messages.slice(-5),
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let aiMessageId = Date.now() + 1;
        let fullContent = '';

        // Add initial empty message for streaming
        setMessages(prev => [...prev, {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true
        }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content') {
                    fullContent += parsed.content;
                    // Update the streaming message
                    setMessages(prev => prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: fullContent }
                        : msg
                    ));
                  } else if (parsed.type === 'done') {
                    // Mark message as complete
                    setMessages(prev => prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, isStreaming: false }
                        : msg
                    ));
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.message);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Streaming error:', error);
          const errorMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: `⚠️ **Streaming Error**\n\nI encountered an error while streaming the response. ${error.message}\n\nYou can try disabling streaming or check your [API Settings](/members/api-settings).`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } finally {
        setIsTyping(false);
        abortControllerRef.current = null;
      }
    } else {
      // Use regular non-streaming API
      try {
        const response = await fetch('/api/ai-analysis/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            message: userMessage.content,
            dashboard_data: dashboardData,
            context: messages.slice(-5),
            stream: false
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const aiMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.response,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          const errorMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: `⚠️ **Error Processing Request**\n\n${data.message || 'I encountered an error while processing your request.'}\n\n**Troubleshooting:**\n- Check if your API key is valid\n- Verify you have sufficient API credits\n- Try testing the connection in [API Settings](/members/api-settings)`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `⚠️ **Connection Error**\n\nI'm unable to connect to the AI service right now. This could be due to:\n- Network connectivity issues\n- API service temporarily unavailable\n- Invalid API configuration\n\nPlease try again in a few moments or check your [API Settings](/members/api-settings).`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "Analisa statistik dashboard dan berikan cadangan penambahbaikan",
    "Bandingkan trend mesyuarat dan acara dalam sistem",
    "Siapa menang di Selangor pada PRU15?",
    "Bandingkan keputusan PRU15 dengan PRU14 di kawasan Parlimen tertentu",
    "Analisa keputusan pilihanraya kecil terbaru",
    "Apakah trend politik terkini di Malaysia?"
  ];

  if (loading || minLoadingTime) {
    return (
      <DashboardLayout user={user} currentPath="members-analysis">
        <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* AI Brain Animation */}
          <div className="relative mb-8">
            {/* Neural Network Background */}
            <div className="absolute inset-0 w-64 h-64">
              {/* Animated Neural Connections */}
              <svg className="w-full h-full opacity-30" viewBox="0 0 256 256">
                {/* Neural Network Lines */}
                <g stroke="currentColor" strokeWidth="1" fill="none" className="text-blue-400">
                  <circle cx="50" cy="50" r="3" className="animate-pulse" style={{ animationDelay: '0s' }}>
                    <animate attributeName="fill-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="206" cy="50" r="3" className="animate-pulse" style={{ animationDelay: '0.3s' }}>
                    <animate attributeName="fill-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="128" cy="100" r="3" className="animate-pulse" style={{ animationDelay: '0.6s' }}>
                    <animate attributeName="fill-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="80" cy="150" r="3" className="animate-pulse" style={{ animationDelay: '0.9s' }}>
                    <animate attributeName="fill-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="176" cy="150" r="3" className="animate-pulse" style={{ animationDelay: '1.2s' }}>
                    <animate attributeName="fill-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="128" cy="206" r="3" className="animate-pulse" style={{ animationDelay: '1.5s' }}>
                    <animate attributeName="fill-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  
                  {/* Connecting Lines */}
                  <line x1="50" y1="50" x2="128" y2="100" className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                    <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="206" y1="50" x2="128" y2="100" className="animate-pulse" style={{ animationDelay: '0.4s' }}>
                    <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="128" y1="100" x2="80" y2="150" className="animate-pulse" style={{ animationDelay: '0.6s' }}>
                    <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="128" y1="100" x2="176" y2="150" className="animate-pulse" style={{ animationDelay: '0.8s' }}>
                    <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="80" y1="150" x2="128" y2="206" className="animate-pulse" style={{ animationDelay: '1.0s' }}>
                    <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="176" y1="150" x2="128" y2="206" className="animate-pulse" style={{ animationDelay: '1.2s' }}>
                    <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="3s" repeatCount="indefinite" />
                  </line>
                </g>
              </svg>
            </div>
            
            {/* Central AI Brain Icon */}
            <div className="relative z-10 w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-ping opacity-20"></div>
              <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.869-1.509l-.548-.547z" />
              </svg>
            </div>
          </div>

          {/* Loading Text Animation */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
              Gathering AI Intelligence
            </h2>
            
            {/* Animated Dots */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Initializing neural networks and preparing AI analysis capabilities...
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 w-64">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} currentPath="members-analysis">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Analysis</h1>
            <p className="text-gray-600 mt-1">Chat with AI to analyze your dashboard data and get insights</p>
          </div>
        </div>

        {!apiConfigured ? (
          /* API Not Configured */
          <Card className="p-6">
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">API Configuration Required</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please configure your Deepseek API settings to enable AI analysis features.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => window.location.href = '/members/api-settings'}
                  variant="outline"
                >
                  Configure API Settings
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Full Width Chat Interface */
          <div className="max-w-6xl mx-auto px-4">
            <Card className="flex flex-col h-[calc(100vh-200px)]">
                {/* Chat Header with Controls */}
                <div className="border-b p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Robot MADANI</h3>
                    </div>
                  </div>
                  
                  {/* Header Controls */}
                  <div className="flex items-center space-x-4">
                    {/* Streaming Toggle */}
                    <div className="flex items-center space-x-2">
                      <label htmlFor="streaming-toggle" className="text-sm font-medium text-gray-700">
                        Stream
                      </label>
                      <button
                        id="streaming-toggle"
                        type="button"
                        role="switch"
                        aria-checked={enableStreaming}
                        onClick={() => setEnableStreaming(!enableStreaming)}
                        className={`${
                          enableStreaming ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        disabled={isTyping}
                      >
                        <span
                          aria-hidden="true"
                          className={`${
                            enableStreaming ? 'translate-x-4' : 'translate-x-0'
                          } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {isTyping && abortControllerRef.current && enableStreaming && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (abortControllerRef.current) {
                              abortControllerRef.current.abort();
                              setIsTyping(false);
                            }
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Stop
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMessages([])}
                        disabled={isTyping}
                        title="Clear Chat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/members/api-settings'}
                        title="API Settings"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Start a conversation with the AI analyst</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm md:max-w-lg lg:max-w-2xl xl:max-w-3xl px-4 py-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-1 h-4 ml-1 bg-gray-600 animate-pulse" />
                          )}
                        </p>
                        <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                          {formatTime(message.timestamp)}
                          {message.isStreaming && (
                            <span className="ml-2 text-blue-600 font-medium">Streaming...</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-sm md:max-w-lg lg:max-w-2xl xl:max-w-3xl px-4 py-3 rounded-lg bg-gray-100">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your dashboard data..."
                      className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="1"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isTyping}
                      className="px-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>

            {/* Suggested Questions - Below Chat */}
            {messages.length === 0 && (
              <Card className="mt-6 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">Get started with these questions:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewMessage(question);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="text-left text-sm p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                      disabled={isTyping}
                    >
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{question}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MembersAnalysis;