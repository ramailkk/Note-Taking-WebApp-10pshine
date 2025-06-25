import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Container, Nav, Button, Form, FormControl, NavDropdown } from 'react-bootstrap';

function TopBar() {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container fluid>
        {/* App name / logo */}
        <Navbar.Brand href="#">NoteNest</Navbar.Brand>

        {/* Responsive toggle for small screens */}
        <Navbar.Toggle aria-controls="topbar-nav" />
        
        <Navbar.Collapse id="topbar-nav">
          {/* Left section */}
          <Nav className="me-auto">
            {/* Placeholder: you can add nav items later */}
          </Nav>

          {/* Center or right section */}
          <Form className="d-flex me-3" style={{ maxWidth: '300px' }}>
            <FormControl
              type="search"
              placeholder="Search notes"
              className="me-2"
              aria-label="Search"
            />
          </Form>

          <Nav>
            <NavDropdown title="👤 John Doe" id="user-nav-dropdown" align="end">
              <NavDropdown.Item href="#profile">Profile</NavDropdown.Item>
              <NavDropdown.Item href="#settings">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#logout">Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopBar;
