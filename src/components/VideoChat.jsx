import React, { useEffect, useState, useRef, useCallback } from "react";
import { Environment } from "@react-three/drei";
import { Model as Avatar } from "./Avatar";
import { Canvas } from "@react-three/fiber";
import { toast } from "react-toastify";
import './verse.css';

export const VideoChat = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [talking, setTalking] = useState(false);
  const [loading, setLoading] = useState(false);
  const avatarRef = useRef();

  // Memoized function to send messages to the backend
  const handleSendMessage = useCallback(async () => {
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

      localStorage.setItem('therapy', JSON.stringify(currentChat));

      // Speak the response
      console.log("start speaking...");
      if ('speechSynthesis' in window) {
        console.log('Speech synthesis supported');

        const speech = new SpeechSynthesisUtterance(reply);
        speech.lang = 'en-US';
        speech.volume = 1; // Maximum volume
        speech.pitch = 1;

        setTalking(true);
        window.speechSynthesis.speak(speech);

        speech.onend = () => {
          setTalking(false);
          console.log('Speech ended');
          setListening(true);
        };
      } else {
        alert('Your browser does not support text-to-speech.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false); // Hide loader
    }
  }, []); // No dependencies, since it only works with localStorage and API calls

  // Memoized function for starting recording
  const startRecording = useCallback(async () => {
    console.log('Recording started');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
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

          handleSendMessage(); // Use the memoized function
          resetSilenceTimer();
        };

        recognition.onend = () => {
          if (isRecording) {
            console.log('Recognition ended');
            setListening(false);
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
          }, 40000);
        }

        recognition.start();
        resetSilenceTimer();
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      console.error('getUserMedia not supported on your browser!');
    }
  }, [handleSendMessage]); // Depend on the memoized handleSendMessage

  // Effect to show a toast when the component mounts
  useEffect(() => {
    toast.info('Since we are using a free server currently. Our Server might go to dormant mode due to inactivity. If you are using this after a long time, please wait for a few seconds for the server to wake up.', {
      position: 'top-center',
      autoClose: 10000,
    });

    const storedChat = [
      { user: 'Therapist', text: 'Hi, I am your therapist. Let us begin the session.' },
    ];
    localStorage.setItem('therapy', JSON.stringify(storedChat));
  }, []);

  // Effect to start recording when `listening` state changes
  useEffect(() => {
    if (listening) {
      startRecording();
    }
  }, [listening, startRecording]);

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
      className="scroll-container bg-cover bg-center h-[100vh] overflow-y-hidden "
      style={{
        backgroundImage: "url('/therapyroom.webp')",
      }}
    >
      <div className={`canvas-wrapper ${sessionStarted ? "unblurred" : "unblurred"}`}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <Avatar ref={avatarRef} position={[0, -6, -4]} scale={5} talking={talking} sessionStarted={sessionStarted} />
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
