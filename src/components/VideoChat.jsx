import React, { useEffect, useState, useRef } from "react";
import { Environment } from "@react-three/drei";
import { Model as Avatar } from "./Avatar";
import { Canvas } from "@react-three/fiber";
import './verse.css';

export const VideoChat = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [talking, setTalking] = useState(false);
  const [loading, setLoading] = useState(false); // State for loader visibility
  const avatarRef = useRef();

  // Start recording and process the speech
  async function startRecording() {
    console.log('Recording started');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let silenceTimer;
        let isRecording = true;
        console.log('Listening...');
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          console.log('Transcription:', transcript);

          let currentChat = JSON.parse(localStorage.getItem('therapy')) || [];
          currentChat.push({ user: 'User', text: transcript });
          localStorage.setItem('therapy', JSON.stringify(currentChat));
          localStorage.setItem('message', transcript);

          handleSendMessage(); // Send the message immediately after getting the user's speech
          resetSilenceTimer();
        };

        recognition.onend = () => {
          if (isRecording) {
            console.log('Recognition ended');
            setListening(false);
            setTalking(true); // Stop listening after recognition ends
          }
        };

        recognition.onerror = (event) => {
          console.error('Recognition error:', event.error);
          clearTimeout(silenceTimer);
        };

        function resetSilenceTimer() {
          clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            isRecording = false;
            recognition.stop();
          }, 10000); // Stop after 10 seconds of silence
        }

        recognition.start();
        resetSilenceTimer();
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      console.error('getUserMedia not supported on your browser!');
    }
  }

  // Send the user's message to the backend and process the response
  const handleSendMessage = async () => {
    setLoading(true); // Show loader
    const userMessage = window.localStorage.getItem('message');
    console.log("message: ", userMessage);
  
    try {
      const response = await fetch('https://backends-nkql.onrender.com/chat', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          previous: JSON.parse(window.localStorage.getItem('therapy')) || [],
        }),
      });
  
      const data = await response.json();
      const reply = data.response;
      console.log("data: ", reply);
  
      const currentChat = JSON.parse(localStorage.getItem('therapy')) || [];
      currentChat.push({ user: 'Therapist', text: reply });
      setChat(currentChat);
      localStorage.setItem('therapy', JSON.stringify(currentChat));
  
      // Speak the response
      console.log("start speaking...");
      if ('speechSynthesis' in window) {
        console.log('Speech synthesis supported');
        
        const speech = new SpeechSynthesisUtterance(reply);
        speech.lang = 'en-US';
        speech.volume = 1; // Maximum volume
        speech.pitch=1;
       
        

  
        window.speechSynthesis.speak(speech);
        
          speech.onend = () => {
        setTalking(false);
        console.log('Speech ended');
          setListening(true); 
          startRecording();
      }
      } else {
        alert('Your browser does not support text-to-speech.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false); // Hide loader
    }
  };
  
  function setVoice(speech, voices) {
    const femaleVoice = voices.find((voice) =>
      voice.name.includes('Female') || voice.gender === 'female' || voice.name.includes('Samantha')
    );
    if (femaleVoice) {
      speech.voice = femaleVoice;
      console.log("Using voice: ", femaleVoice.name);
    } else {
      console.log("No specific female voice found, using default.");
    }
  }
  

  useEffect(() => {
    const storedChat = [
      { user: 'Therapist', text: 'Hi, I am your therapist. Let us begin the session.' },
    ];
    localStorage.setItem('therapy', JSON.stringify(storedChat));
  }, []);

  useEffect(() => {
    
    if (listening) {
      startRecording();
    }
  }, [listening]);

  const startSession = () => {
    setSessionStarted(true);
    setListening(true);
  };

  const stopSession = () => {
    setSessionStarted(false);
    setListening(false);
    localStorage.removeItem('therapy');
    localStorage.removeItem('message');
  };

  return (
    <div
      className="scroll-container bg-cover bg-center h-[100vh] overflow-y-hidden"
      style={{
        backgroundImage: "url('/therapyroom.webp')",
      }}
    >
      <div className={`canvas-wrapper ${sessionStarted ? "unblurred" : ""}`}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <Avatar ref={avatarRef} position={[2.5, -6, -4]} scale={5} />
          <Environment preset="sunset" />
          {loading && (
            <mesh position={[4, -6, -4]}>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color="orange" />
            </mesh>
          )}
        </Canvas>
      </div>
      <div className="ui-container">
        {!sessionStarted ? (
          <button className="start-button" onClick={startSession}>
            Start Session
          </button>
        ) : (
          <button className="stop-button" onClick={stopSession}>
            Stop Session
          </button>
        )}
      </div>
    </div>
  );
};
