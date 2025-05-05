import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import apiService from '../../api/apiService';
import { resetAuth } from '../../store/slices/authSlice';
import { Send, Loader2, User, Bot, Plus, Stethoscope, Thermometer, HeartPulse } from 'lucide-react';

// Validation schema for the message input
const validationSchema = Yup.object({
  message: Yup.string()
    .trim()
    .required()
    .min(1),
});

// Interface for the message payload
interface MessagePayload {
  message: string;
}

// Interface for the API response
interface ChatResponse {
  message: string;
}

// Interface for a chat message (user or bot)
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

// Quick action button interface
interface QuickAction {
  icon: React.ReactNode;
  text: string;
  prompt: string;
}

const HealthAssistant: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Quick action buttons
  const quickActions: QuickAction[] = [
    {
      icon: <Thermometer size={18} className="text-blue-500" />,
      text: "Fever symptoms",
      prompt: "I have a fever of 101°F for the past 2 days with chills and body aches."
    },
    {
      icon: <HeartPulse size={18} className="text-red-500" />,
      text: "Chest pain",
      prompt: "I'm experiencing mild chest pain when I take deep breaths."
    },
    {
      icon: <Stethoscope size={18} className="text-green-500" />,
      text: "General checkup",
      prompt: "What should I expect during my annual physical examination?"
    }
  ];

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          text: "Hello! I'm your AI health assistant. I can help with:\n\n• Symptom analysis\n• Medication information\n• General health advice\n• First aid guidance\n\nHow can I help you today?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }, 500);
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user?.id || !accessToken) {
      dispatch({ type: 'NOTIFY_ERROR', payload: 'Please log in to use the health assistant' });
      dispatch(resetAuth());
      navigate('/login');
    }
  }, [user, accessToken, dispatch, navigate]);

  // Scroll to the bottom of the chat container when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-focus the input field
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Simulate typing effect
  const simulateTypingEffect = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  // Handle quick action click
  const handleQuickAction = (prompt: string) => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = prompt;
    }
  };

  // Handle form submission
  const handleSubmit = async (
    values: MessagePayload,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    try {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        text: values.message,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      // Add user message to the conversation
      setMessages((prev) => [...prev, userMessage]);
      
      // Reset the form early to improve UX
      resetForm();
      setShowQuickActions(false);
      
      // Simulate bot typing indicator
      simulateTypingEffect();

      // Make POST API call
      const response = await apiService.post<ChatResponse>('/chatbot/message', { message: values.message });
      
      // Add bot response to the conversation
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error: any) {
      console.error('API Error:', error);
      const errorMessage = error.message || 'Failed to send message';
      const statusCode = error.statusCode || (error.response?.status as number | undefined);
      dispatch({ type: 'NOTIFY_ERROR', payload: errorMessage });
      
      if (statusCode === 401) {
        dispatch({ type: 'NOTIFY_ERROR', payload: 'Session expired. Please log in again.' });
        dispatch(resetAuth());
        navigate('/login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Bot size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Health Assistant</h2>
            <p className="text-sm text-gray-500">AI-powered healthcare companion</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="h-[400px] md:h-[500px] overflow-y-auto rounded-xl p-4 mb-4 bg-gray-50 shadow-inner"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                ${message.sender === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-blue-600'}`}>
                {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              {/* Message bubble */}
              <div
                className={`p-4 rounded-2xl shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' 
                    ? 'text-blue-100' 
                    : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-blue-600">
                <Bot size={16} />
              </div>
              <div className="p-3 bg-white rounded-2xl rounded-bl-none border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions (shown only when no messages exchanged) */}
        {showQuickActions && messages.length === 1 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2 text-center">Try asking about:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                >
                  {action.icon}
                  <span className="text-gray-700">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <Formik
        initialValues={{ message: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values }) => (
          <Form className="relative">
            <div className="flex items-center space-x-2">
              <button 
                type="button" 
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                onClick={() => setShowQuickActions(!showQuickActions)}
              >
                <Plus size={20} />
              </button>
              <div className="flex-1 relative">
                <Field
                  innerRef={inputRef}
                  type="text"
                  name="message"
                  placeholder="Describe your symptoms or ask a health question..."
                  className="w-full p-4 pr-14 border border-gray-300 rounded-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !values.message.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                    isSubmitting || !values.message.trim()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                  } text-white transition-colors`}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
      
      {/* Health disclaimer */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        <span className="inline-block px-2 py-1 bg-gray-100 rounded-lg">
          Note: This assistant provides general information only and should not replace professional medical advice.
        </span>
      </p>
    </div>
  );
};

export default HealthAssistant;