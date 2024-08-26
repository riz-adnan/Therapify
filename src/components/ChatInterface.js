import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, ListGroup, Form, Button, Dropdown, Modal, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash, FaGlobe } from 'react-icons/fa';
import Flag from 'react-world-flags';
import './ChatInterface.css';

const ChatInterface = () => {
  const [chats, setChats] = useState([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [isLoading, setIsLoading] = useState(false);
  const [showCiteSources, setShowCiteSources] = useState(false);
  const [currentCiteSources, setCurrentCiteSources] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const popupTimer = useRef(null);

  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem('chats')) || [];
    setChats(storedChats);
  }, [showPopup]);

  const handleNewChat = () => {
    const newChat = { name: 'New Chat', messages: [] };
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setCurrentChatIndex(updatedChats.length - 1);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  const handleChatClick = (index) => {
    console.log(index);
    setCurrentChatIndex(index);
  };

  const handleSendMessage = async () => {
    if (message.trim() && currentChatIndex !== null) {
      setIsLoading(true);
      setShowPopup(false);
      clearTimeout(popupTimer.current);

      try {
        setShowPopup(true);
        const response = await fetch('https://backends-nkql.onrender.com/chat', {
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          body: JSON.stringify({
            message: message,
            previous: chats[currentChatIndex]?.messages || [],
          }),
        });

        setShowPopup(false);

        const data = await response.json();
        clearTimeout(popupTimer.current);
        const aimessage = data.response;
        const citesources = data.top_5_results;

        const updatedChats = chats.map((chat, index) => {
          if (index === currentChatIndex) {
            const newChat = {
              ...chat,
              name: chat.name === 'New Chat' ? message.substring(0, 20) : chat.name,
              messages: [
                ...chat.messages,
                { user: 'User', text: message },
                { user: 'Therapist', text: aimessage, citesources: citesources },
              ],
            };

            return newChat;
          }
          return chat;
        });

        setChats(updatedChats);
        localStorage.setItem('chats', JSON.stringify(updatedChats));
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (
      currentChatIndex !== null &&
      chats[currentChatIndex]?.name === 'New Chat' &&
      chats[currentChatIndex]?.messages?.length === 1
    ) {
      const newName = chats[currentChatIndex].messages[0].text.substring(0, 20);
      const updatedChats = chats.map((chat, index) => {
        if (index === currentChatIndex) {
          const newChat = { ...chat, name: newName };
          return newChat;
        }
        return chat;
      });
      setChats(updatedChats);
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    }
  }, [currentChatIndex, chats]);

  const handleDeleteChat = (index) => {
    const updatedChats = chats.filter((_, i) => i !== index);
    setChats(updatedChats);
    setCurrentChatIndex(null);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    if (country !== 'India') {
      alert('We are constructing it');
    }
  };

  const handleShowCiteSources = (citesources) => {
    setCurrentCiteSources(citesources);
    setShowCiteSources(true);
  };

  return (
    <Container fluid className="chat-interface h-100">
      <Row className="h-100">
        <Col md={3} className="sidebar h-100">
          
          <Button variant="primary" className="new-chat-btn" onClick={handleNewChat}>
            <FaPlus className="me-2" /> New Chat
          </Button>
          <ListGroup className="chat-list">
            {chats.map((chat, index) => (
              <ListGroup.Item
                key={index}
                className="d-flex justify-content-between align-items-center chat-item"
                onClick={() => handleChatClick(index)}
              >
                <span>{chat.name}</span>
                <FaTrash
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(index);
                  }}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col  className="chat-display h-100">
          {currentChatIndex !== null && chats[currentChatIndex]?.messages ? (
            <div className="chat-window">
              <div className="chat-messages">
                {chats[currentChatIndex].messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.user === 'User' ? 'user-message' : 'model-message'}`}
                  >
                    <strong>{msg.user}:</strong> {msg.text}
                    
                  </div>
                ))}
              </div>
              <Form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="chat-input">
                <Form.Control
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="message-input"
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
            </div>
          ) : (
            <h3>Select a chat to start messaging</h3>
          )}
        </Col>
      </Row>

      

     
    </Container>
  );
};

export default ChatInterface;
