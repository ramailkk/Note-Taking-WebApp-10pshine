import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { FaGoogle, FaLinkedin, FaGithub } from 'react-icons/fa';



function SignUp() {
  const handleOAuthSignup = (provider) => {
    window.location.href = `https://your-backend.com/auth/${provider}`;
  };
  

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Form 
        className="p-4 border rounded shadow-sm text-center"
        style={{ minWidth: '320px', maxWidth: '400px', width: '100%' }}
      >
        <h2 className="mb-4">Sign Up</h2>

        <Form.Group className="mb-3" controlId="formBasicName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control type="text" placeholder="John Doe" required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" placeholder="johndoe@gmail.com" required />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Create a strong password" required />
        </Form.Group>

        <Form.Group className="mb-4" controlId="formConfirmPassword">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control type="password" placeholder="Re-enter your password" required />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100 mb-3">
          Create Account
        </Button>

        <hr />
        <p className="text-muted">Or sign up with</p>

        <div className="d-flex justify-content-center gap-3 mb-3">
          <Button 
            variant="light" 
            onClick={() => handleOAuthSignup('google')} 
            className="border rounded-circle p-3"
          >
            <FaGoogle size={24} />
          </Button>
          <Button 
            variant="light" 
            onClick={() => handleOAuthSignup('linkedin')} 
            className="border rounded-circle p-3"
          >
            <FaLinkedin size={24} />
          </Button>
          <Button 
            variant="light" 
            onClick={() => handleOAuthSignup('github')} 
            className="border rounded-circle p-3"
          >
            <FaGithub size={24} />
          </Button>
        </div>

        <p className="mt-4 text-center">
          Already have an account? <a href="/login">Login</a>
        </p>
      </Form>
    </Container>
  );
}

export default SignUp;
