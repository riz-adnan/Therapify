import React from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import {  FaRobot, FaVideo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Particles from 'react-particles';
import {Tilt} from 'react-tilt';

import {Link} from 'react-router-dom'
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Particles
        className="particles"
        params={{
          particles: {
            number: { value: 100 },
            size: { value: 3 },
          },
          interactivity: {
            events: {
              onhover: { enable: true, mode: 'repulse' },
            },
          },
        }}
      />
      <Container fluid className="text-center d-flex flex-column justify-content-center ">
        <motion.h1 
          className="mb-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ fontSize: '4rem' }}
        >
          Welcome to Therapify
        </motion.h1>
        <motion.p 
          className="mb-5"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ fontSize: '1.5rem' }}
        >
          Free Online Therapy Sessions. Start a session now!
        </motion.p>
        <Row className="justify-content-center mb-5">
          <Col xs={12} md={6} lg={4} className="mb-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Tilt className="Tilt" options={{ max: 25 }}>
                <Link to="/videochat" smooth={true} duration={1000}>
                  <Button variant="primary" size="lg" className="w-100 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2" style={{ fontSize: '1.5rem' }}>
                    <div className="flex items-center justify-center pb-3 pt-3">
                    <FaVideo className="mr-5" /> Session with Therapist.
                    </div>
                  </Button>
                </Link>
              </Tilt>
            </motion.div>
          </Col>
          <Col xs={12} md={6} lg={4}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Tilt className="Tilt" options={{ max: 25 }}>
                <Link to="/chat" smooth={true} duration={1000}>
                  <Button variant="secondary" size="lg" className=" w-100 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2" style={{ fontSize: '1.5rem' }}>
                   <div className="flex items-center justify-center pb-3 pt-3">
                      
                    <FaRobot className="mr-5 " /> Chat with your Therpaist.
                    </div>
                  </Button>
                </Link>
              </Tilt>
            </motion.div>
          </Col>
        </Row>
      </Container>
      
    </div>
  );
};

export default LandingPage;
