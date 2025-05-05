import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import apiService from '../../api/apiService';
import { resetAuth } from '../../store/slices/authSlice';
import { Send, Loader2, User, Bot } from 'lucide-react';

// Validation schema for the message input
const validationSchema = Yup.object({
  message: Yup.string()
    .trim()
    .required('Message is required')
    .min(1, 'Message cannot be empty'),
});

// Interface for the message payload
interface MessagePayload {
  message: string;
}

// Interface for the API response (assumed format)
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

const HealthAssistant: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          text: "Hello! I'm your health assistant. How are you feeling today?",
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

      // Silent success - no need for notification for every message
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
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-100">
      <h2 className="text-3xl font-bold mb-2 text-center text-primary">Health Assistant</h2>
      <p className="text-gray-500 text-center mb-6">Your personal AI-powered healthcare companion</p>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="h-96 overflow-y-auto rounded-lg p-4 mb-4 bg-gray-50 shadow-inner"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-xs md:max-w-md gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-primary'}`}>
                {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              {/* Message bubble */}
              <div
                className={`p-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-gray-200' : 'text-gray-400'}`}>
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-primary">
                <Bot size={16} />
              </div>
              <div className="p-3 bg-white rounded-2xl rounded-tl-none border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
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
        {({ isSubmitting }) => (
          <Form className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Field
                innerRef={inputRef}
                type="text"
                name="message"
                placeholder="Describe your symptoms or ask a health question..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <ErrorMessage name="message" component="div" className="text-red-500 text-sm mt-1 ml-3" />
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </Form>
        )}
      </Formik>
      
      {/* Health disclaimer */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        This assistant provides general information only and should not replace professional medical advice.
      </p>
    </div>
  );
};

export default HealthAssistant;