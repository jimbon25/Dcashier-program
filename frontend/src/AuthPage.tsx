import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAppDispatch } from './store/hooks';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setCredentials } from './store/slices/authSlice';
import { authService } from './services/auth.service';

const AuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = isRegister
        ? await authService.register({ username, password, confirmPassword })
        : await authService.login({ username, password });

      if (response.accessToken) {
        dispatch(setCredentials({
          token: response.accessToken,
          role: response.role
        }));
        toast.success(isRegister ? 'Registration successful!' : 'Login successful!');
        navigate('/dashboard');
      } else {
        setError('Authentication failed');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">
            {isRegister ? 'Register' : 'Login'}
          </Card.Title>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            {isRegister && (
              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>
            )}

            <Button variant="primary" type="submit" className="w-100 mt-3" disabled={loading}>
              {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <Button
              variant="link"
              onClick={() => setIsRegister(!isRegister)}
              className="text-decoration-none"
            >
              {isRegister
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuthPage;
