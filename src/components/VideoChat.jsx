import React, { useEffect, useState } from "react";
import { Environment, useTexture } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { Canvas, useThree } from "@react-three/fiber";
import './verse.css';

const Background = () => {
  const texture = useTexture('back.jpg');
  const { viewport } = useThree();

  return (
    <mesh position={[0, 0, -10]} renderOrder={-1} scale={3}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
};

export const VideoChat = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [talking, setTalking] = useState(false);

  function startRecording() {
    console.log('Recording started');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          let silenceTimer;
          let isRecording = true;

          recognition.onresult = event => {
            const transcript = event.results[0][0].transcript;
            console.log('Transcription:', transcript);

            let currentChat = JSON.parse(localStorage.getItem('therapy')) || [];
            currentChat.push({ user: 'User', text: transcript });
            localStorage.setItem('therapy', JSON.stringify(currentChat));
            localStorage.setItem('message', transcript);

            handleSendMessage();  // Send the message immediately after getting the user's speech

            // Reset the silence timer after each result
            resetSilenceTimer();
          };

          recognition.onend = () => {
            if (isRecording) {
              console.log('Recognition ended');
              setListening(false); // Stop listening after recognition ends
            }
          };

          recognition.onerror = event => {
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
        })
        .catch(error => console.error('Error accessing microphone:', error));
    } else {
      console.error('getUserMedia not supported on your browser!');
    }
  }

  const handleSendMessage = async () => {
    console.log("message: ", window.localStorage.getItem('message'));
  
    const response = await fetch('https://backends-nkql.onrender.com/chat', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        message: window.localStorage.getItem('message'),
        previous: JSON.parse(window.localStorage.getItem('therapy')) || [],
      }),
    });
  
    let data = await response.json();
    data = data.response;
    console.log("data: ", data);
    let currentChat = JSON.parse(localStorage.getItem('therapy')) || [];
    currentChat.push({ user: 'Therapist', text: data });
    setChat(currentChat);
    localStorage.setItem('therapy', JSON.stringify(currentChat));
  
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(data);
      speech.lang = 'en-US';
      speech.volume = 1; 
      speech.rate = 1;
      speech.pitch = 1;
  
      const voices = window.speechSynthesis.getVoices();
      for (let i = 0; i < voices.length; i++) {
        if(voices[i].name === 'Microsoft Zira - English (United States)')
        {
          speech.voice = voices[i];
          break;
        }
        console.log(voices[i]);
      }
      const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.gender === 'female' || voice.name.includes('Samantha'));
  
      
        speech.voice = femaleVoice;
      

      speech.onend = () => {
        console.log('Speech ended');
        setListening(true); // Start listening after speech ends
      };
  
      window.speechSynthesis.speak(speech);
      setTalking(true);
    } else {
      alert('Your browser does not support text-to-speech.');
    }
  }
  
  useEffect(() => {
    const storedChat = [];
    storedChat.push({ user: 'Therapist', text: 'Hi, I am your therapist. Let us begin the session.' });
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
    <div className="container">
      {!sessionStarted ? (
        <button className="start-button" onClick={startSession}>
          Start Session
        </button>
      ) : (
        <button className="stop-button" onClick={stopSession}>
          Stop Session
        </button>
      )}
      <div className={`canvas-wrapper ${sessionStarted ? "unblurred" : ""}`}>
        <Canvas>
          <Background />
          <Avatar position={[-0.5, -6.5, -4]} scale={5} />
          <Environment preset="sunset" />
        </Canvas>
      </div>
    </div>
  );
};
