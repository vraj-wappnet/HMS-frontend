import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Users, X, Camera, Settings } from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { setCurrentAppointment, updateAppointment } from '../../store/slices/appointmentSlice';

const VideoConsultation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentAppointment, loading } = useSelector((state: RootState) => state.appointments);
  const { user, userRole } = useSelector((state: RootState) => state.auth);
  
  // Video states
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ sender: string; text: string; timestamp: Date }[]>([]);
  
  // Stream references
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Simulated loading state
  const [connecting, setConnecting] = useState(true);
  
  useEffect(() => {
    // Mark appointment as in-progress
    if (id && currentAppointment?.id !== id) {
      // Fetch appointment details if not already loaded
      // This would normally come from the appointments slice
      dispatch(setCurrentAppointment({
        id,
        patientId: '123',
        doctorId: '456',
        date: new Date().toISOString(),
        startTime: '10:00 AM',
        endTime: '10:30 AM',
        status: 'scheduled',
        type: 'video',
        doctorName: 'Dr. Sarah Johnson',
        patientName: 'John Smith',
      }));
      
      dispatch(updateAppointment({
        id,
        data: { status: 'in-progress' },
      }));
    }
    
    // Initialize local video
    const initializeVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        localStreamRef.current = stream;
        
        // Simulate connection establishment
        setTimeout(() => {
          setConnecting(false);
          // Add welcome message
          setMessages([
            {
              sender: 'System',
              text: 'You are now connected to the consultation.',
              timestamp: new Date(),
            },
          ]);
        }, 2000);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };
    
    initializeVideo();
    
    // Clean up on unmount
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [id, dispatch, currentAppointment?.id]);
  
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };
  
  const endCall = () => {
    // Mark appointment as completed
    dispatch(updateAppointment({
      id: id!,
      data: { status: 'completed' },
    }));
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    // Navigate back
    navigate(userRole === 'doctor' ? '/doctor/consultations' : '/patient/appointments');
  };
  
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          sender: `${user?.firstName} ${user?.lastName}`,
          text: message,
          timestamp: new Date(),
        },
      ]);
      setMessage('');
      
      // Simulate doctor/patient response after a few seconds
      if (messages.length < 5) {
        setTimeout(() => {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: userRole === 'doctor' ? currentAppointment?.patientName || 'Patient' : currentAppointment?.doctorName || 'Doctor',
              text: userRole === 'doctor'
                ? 'Thank you, doctor. I have a question about my medication.'
                : 'How are you feeling today? Any improvements since our last appointment?',
              timestamp: new Date(),
            },
          ]);
        }, 3000);
      }
    }
  };
  
  if (loading || !currentAppointment) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-10rem)] bg-gray-900 rounded-lg overflow-hidden">
      {/* Video grid */}
      <div className="h-[calc(100vh-14rem)] relative">
        {/* Remote video (fullscreen) */}
        {!connecting ? (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <Camera size={48} className="mx-auto mb-2 text-gray-400" />
              <p className="text-xl font-medium">
                {userRole === 'doctor' ? currentAppointment.patientName : currentAppointment.doctorName}
              </p>
              <p className="text-sm text-gray-400 mt-1">Camera is off</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl font-medium">Connecting...</p>
              <p className="text-sm text-gray-400 mt-1">Please wait while we establish a secure connection</p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <VideoOff size={24} className="mx-auto mb-1" />
                <p className="text-xs">Camera Off</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <div
          className={`absolute top-0 ${
            isChatOpen ? 'right-0' : '-right-80'
          } h-full w-80 bg-white transition-all duration-300 shadow-lg flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium">Chat</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === 'System'
                    ? 'justify-center'
                    : msg.sender === `${user?.firstName} ${user?.lastName}`
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                {msg.sender === 'System' ? (
                  <div className="bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-500">
                    {msg.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.sender === `${user?.firstName} ${user?.lastName}`
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1">{msg.sender}</p>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-right mt-1 opacity-70">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="p-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                <MessageSquare size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 py-6 flex items-center justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full ${
            audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-error'
          } text-white`}
        >
          {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${
            videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-error'
          } text-white`}
        >
          {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-error text-white hover:bg-error/90"
        >
          <Phone size={24} />
        </button>
        
        <button
          onClick={() => setIsChatOpen(true)}
          className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600"
        >
          <MessageSquare size={24} />
        </button>
        
        <button
          className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Call info */}
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div>
          <p className="font-medium">
            {userRole === 'doctor' 
              ? `Consultation with ${currentAppointment.patientName}`
              : `Consultation with ${currentAppointment.doctorName}`
            }
          </p>
          <p className="text-sm text-gray-400">
            {new Date(currentAppointment.date).toLocaleDateString()} | {currentAppointment.startTime} - {currentAppointment.endTime}
          </p>
        </div>
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <Users size={18} className="mr-2 text-gray-400" />
            <span className="text-sm">2 Participants</span>
          </div>
          <div className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
            {connecting ? 'Connecting...' : 'Connected'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;