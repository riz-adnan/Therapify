import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, ListGroup, Form, Button, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';
import './ChatInterface.css';
import { toast } from "react-toastify";
const ChatInterface = () => {
  const [chats, setChats] = useState([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeout = useRef(null);

  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem('chats')) || [];
    setChats(storedChats);
  }, []);

  const handleNewChat = () => {
    const newChat = { name: 'New Chat', messages: [{ user: 'Therapist', text: 'Hi, I am your therapist. How can I help you?' }] };
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setCurrentChatIndex(updatedChats.length - 1);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  const handleChatClick = (index) => {
    setCurrentChatIndex(index);
  };

  const handleSendMessage = async () => {
    if (message.trim() && currentChatIndex !== null) {
      setIsLoading(true);
      loadingTimeout.current = setTimeout(() => {
         toast.info('Since we are using a free server currently. Our Server might go to domant mode due to inactivity. If you are using this after a long time, please wait for a few seconds for the server to wake up.', {
              position: 'top-center',
              autoClose: 10000,
            });
      }, 5000);
      try {
        const response = await fetch('https://backends-nkql.onrender.com/chat', {
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          body: JSON.stringify({
            message,
            previous: chats[currentChatIndex]?.messages || [{ user: 'Therapist', text: 'Hi, I am your therapist. How can I help you?' }],
          }),
        });
        clearTimeout(loadingTimeout.current);
        const data = await response.json();
        const aimessage = data.response;
        
        const updatedChats = chats.map((chat, index) => {
          if (index === currentChatIndex) {
            const newMessages = [...chat.messages, { user: 'User', text: message }, { user: 'Therapist', text: aimessage }];
            const newName = newMessages[0].text.substring(0, 20);
            return {
              ...chat,
              name: newName,
              messages: newMessages,
            };
          }
          return chat;
        });

        setChats(updatedChats);
        localStorage.setItem('chats', JSON.stringify(updatedChats));
        setMessage('');
      } catch (error) {
        clearTimeout(loadingTimeout.current);
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteChat = (index) => {
    const updatedChats = chats.filter((_, i) => i !== index);
    setChats(updatedChats);
    setCurrentChatIndex(null);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  return (
    <Container fluid className="chat-interface" style={{ height: '100vh', backgroundColor: '#1e1e2e', color: '#fff' }}>
      <Row style={{ height: '100%' }}>
        <Col md={3} className="sidebar p-3" style={{ backgroundColor: '#27293d', borderRight: '1px solid #444' }}>
          <Button variant="success" className="w-100 mb-3" onClick={handleNewChat}>
            <FaPlus className="me-2" /> New Chat
          </Button>
          <ListGroup variant="flush">
            {chats.map((chat, index) => (
              <ListGroup.Item
                key={index}
                className={`d-flex justify-content-between align-items-center chat-item ${currentChatIndex === index ? 'active' : ''}`}
                onClick={() => handleChatClick(index)}
                style={{ cursor: 'pointer', backgroundColor: currentChatIndex === index ? '#444' : '#27293d', color: '#fff' }}
              >
                {chat.name}
                <FaTrash
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(index);
                  }}
                  style={{ cursor: 'pointer', color: '#ff5c5c' }}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        <Col md={9} className="chat-display d-flex flex-column" style={{ height: '100%' }}>
          {currentChatIndex !== null && chats[currentChatIndex]?.messages ? (
            <div className="chat-window flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#2e2f3e', borderRadius: '5px' }}>
              {chats[currentChatIndex].messages.map((msg, index) => (
                <div key={index} className={`message ${msg.user === 'User' ? 'user-message' : 'therapist-message'} mb-3`}>
                  <div style={{ backgroundColor: msg.user === 'User' ? '#3d85c6' : '#6aa84f', padding: '10px', borderRadius: '10px', color: '#fff' }}>
                    <strong>{msg.user}:</strong> {msg.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="d-flex justify-content-center align-items-center flex-grow-1">
              <h4 style={{ color: '#888' }}>Select a chat or start a new conversation.</h4>
            </div>
          )}

          <Form className="d-flex mt-3" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <Form.Control
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ flex: 1, marginRight: '10px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '5px' }}
              disabled={isLoading}
            />
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              ) : (
                'Send'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatInterface;
