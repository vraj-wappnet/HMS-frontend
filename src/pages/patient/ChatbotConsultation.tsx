import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Send, Bot, AlertCircle, X, Check, Loader2 } from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { addMessage, sendMessage, analyzeSymptoms, addSymptom, removeSymptom, clearChat } from '../../store/slices/chatbotSlice';

// Symptom severity options
const severityOptions = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

// Symptom duration options
const durationOptions = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

// Message schema
const messageSchema = Yup.object().shape({
  message: Yup.string().required('Please enter a message'),
});

// Symptom schema
const symptomSchema = Yup.object().shape({
  name: Yup.string().required('Symptom name is required'),
  severity: Yup.string().oneOf(['mild', 'moderate', 'severe'], 'Invalid severity').required('Severity is required'),
  duration: Yup.string().required('Duration is required'),
});

const ChatbotConsultation: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, reportedSymptoms, loading, analysisLoading, analysisResult } = useSelector(
    (state: RootState) => state.chatbot
  );
  const [showSymptomForm, setShowSymptomForm] = useState(false);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (values: { message: string }, { resetForm }: any) => {
    // Add user message to chat
    dispatch(addMessage({
      id: Date.now().toString(),
      sender: 'user',
      content: values.message,
      timestamp: new Date().toISOString(),
    }));
    
    resetForm();
    
    try {
      await dispatch(sendMessage(values.message)).unwrap();
    } catch (error) {
      // Error is handled in the slice
    }
  };

  const handleAddSymptom = (values: any, { resetForm }: any) => {
    dispatch(addSymptom({
      id: Date.now().toString(),
      ...values,
    }));
    resetForm();
    setShowSymptomForm(false);
  };

  const handleRemoveSymptom = (id: string) => {
    dispatch(removeSymptom(id));
  };

  const handleAnalyzeSymptoms = () => {
    if (reportedSymptoms.length > 0) {
      dispatch(analyzeSymptoms(reportedSymptoms));
    }
  };

  const handleClearChat = () => {
    dispatch(clearChat());
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="bg-white rounded-lg shadow-md flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="bg-primary px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center">
            <Bot size={24} className="mr-3" />
            <div>
              <h2 className="font-semibold">Healthcare Assistant</h2>
              <p className="text-sm text-white/80">AI-powered symptom checker</p>
            </div>
          </div>
          <div>
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-primary/80 rounded-full"
              title="Clear chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary/10 text-gray-800'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex items-center mb-1">
                      <Bot size={16} className="text-primary mr-1" />
                      <span className="text-xs font-medium text-primary">Healthcare Assistant</span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 rounded-lg bg-white border border-gray-200">
                  <div className="flex items-center">
                    <Bot size={16} className="text-primary mr-1" />
                    <span className="text-xs font-medium text-primary">Healthcare Assistant</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-primary rounded-full mr-1 animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full mr-1 animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Symptom reporting section */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Reported Symptoms</h3>
                <button
                  onClick={() => setShowSymptomForm(!showSymptomForm)}
                  className="text-xs text-primary font-medium hover:text-primary/80"
                >
                  {showSymptomForm ? 'Cancel' : '+ Add Symptom'}
                </button>
              </div>

              {showSymptomForm && (
                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  <Formik
                    initialValues={{
                      name: '',
                      severity: 'moderate',
                      duration: '',
                    }}
                    validationSchema={symptomSchema}
                    onSubmit={handleAddSymptom}
                  >
                    {({ errors, touched }) => (
                      <Form className="space-y-3">
                        <div>
                          <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                            Symptom Name
                          </label>
                          <Field
                            name="name"
                            type="text"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="e.g., Headache, Fever, Cough"
                          />
                          {errors.name && touched.name && (
                            <p className="mt-1 text-xs text-error">{errors.name}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="severity" className="block text-xs font-medium text-gray-700 mb-1">
                              Severity
                            </label>
                            <Field
                              as="select"
                              name="severity"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {severityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Field>
                          </div>

                          <div>
                            <label htmlFor="duration" className="block text-xs font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <Field
                              as="select"
                              name="duration"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">Select duration</option>
                              {durationOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Field>
                            {errors.duration && touched.duration && (
                              <p className="mt-1 text-xs text-error">{errors.duration}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary/90"
                          >
                            Add Symptom
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              )}

              {reportedSymptoms.length === 0 ? (
                <div className="text-center py-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
                  <AlertCircle size={20} className="mx-auto mb-1 text-gray-400" />
                  <p className="text-sm text-gray-500">No symptoms reported yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add symptoms manually or describe them in the chat
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-3">
                  {reportedSymptoms.map((symptom) => (
                    <div
                      key={symptom.id}
                      className="inline-flex items-center bg-gray-100 rounded-full pl-3 pr-2 py-1"
                    >
                      <span className="text-xs font-medium mr-1">{symptom.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full mr-1 ${
                        symptom.severity === 'mild' ? 'bg-success/20 text-success' :
                        symptom.severity === 'moderate' ? 'bg-warning/20 text-warning' :
                        'bg-error/20 text-error'
                      }`}>
                        {symptom.severity}
                      </span>
                      <button
                        onClick={() => handleRemoveSymptom(symptom.id)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {reportedSymptoms.length > 0 && (
                <div className="text-right">
                  <button
                    onClick={handleAnalyzeSymptoms}
                    disabled={analysisLoading}
                    className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    {analysisLoading ? (
                      <>
                        <Loader2 size={12} className="mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Check size={12} className="mr-1" />
                        Analyze Symptoms
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Message input */}
            <Formik
              initialValues={{ message: '' }}
              validationSchema={messageSchema}
              onSubmit={handleSendMessage}
            >
              {({ isSubmitting, isValid }) => (
                <Form className="flex items-center space-x-2">
                  <Field
                    name="message"
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Type your message..."
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValid || loading}
                    className="p-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotConsultation;