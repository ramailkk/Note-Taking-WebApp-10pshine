import 'bootstrap/dist/css/bootstrap.min.css';
import { ListGroup, Button, FormControl } from 'react-bootstrap';
import { useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';

function Sidebar({ notebooks = [], onNotebookSelect }) {
  const [activeSection, setActiveSection] = useState('Home');

  return (
    <div
      className="d-flex flex-column bg-light vh-100 border-end px-2 pt-2 pb-3"
      style={{ width: '140px', fontSize: '0.8rem' }}
    >
      <div className="text-center fw-bold mb-2" style={{ fontSize: '0.9rem' }}>
        Note-taker
      </div>      

      {/* SECTION SELECTORS */}

      <ListGroup variant="flush" className="mb-2 text-center">
        <ListGroup.Item
          action
          active={activeSection === 'Home'}
          onClick={() => setActiveSection('Home')}
          className="py-3 px-3 mb-3 border rounded-3"
          style={{ fontSize: '1.0rem' }}
        >
             Home
        </ListGroup.Item>
        <ListGroup.Item
          action
          active={activeSection === 'notes'}
          onClick={() => setActiveSection('notes')}
          className="py-3 px-3 mb-3 border rounded-3"
          style={{ fontSize: '1.0rem' }}
        >
             Notes
        </ListGroup.Item>
        <ListGroup.Item
          action
          active={activeSection === 'classes'}
          onClick={() => setActiveSection('classes')}
          className="py-3 px-3 mb-5 border rounded-3"
          style={{ fontSize: '1.0rem' }}
        >
             Classes
        </ListGroup.Item>
      
      </ListGroup>

    </div>
  );
}

export default Sidebar;
