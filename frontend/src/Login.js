import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { FaGoogle, FaLinkedin, FaGithub } from 'react-icons/fa';

function Login() {
  const handleOAuthLogin = (provider) => {
    window.location.href = `https://your-backend.com/auth/${provider}`;
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Form 
        className="p-4 border rounded shadow-sm text-center" 
        style={{ minWidth: '320px', maxWidth: '400px', width: '100%' }}
      >
        <h2 className="mb-4">Welcome to note-taker</h2>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" placeholder="johndoe@gmail.com" />
          {/* <Form.Text className="text-muted">
            We'll never share your email.
          </Form.Text> */}
        </Form.Group>

        <Form.Group className="mb-4" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Enter your password" />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100 mb-3">
          Login
        </Button>

        <hr />
        <p className="text-muted">Or sign in with</p>

        <div className="d-flex justify-content-center gap-3 mb-3">
          <Button 
            variant="light" 
            onClick={() => handleOAuthLogin('google')} 
            className="border rounded-circle p-3"
          >
            <FaGoogle size={24} />
          </Button>
          <Button 
            variant="light" 
            onClick={() => handleOAuthLogin('linkedin')} 
            className="border rounded-circle p-3"
          >
            <FaLinkedin size={24} />
          </Button>
          <Button 
            variant="light" 
            onClick={() => handleOAuthLogin('github')} 
            className="border rounded-circle p-3"
          >
            <FaGithub size={24} />
          </Button>
        </div>

        {/* Sign up Link here */}
        <p className="mt-4 text-center">
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>
      </Form>
    </Container>
  );
}

export default Login;
