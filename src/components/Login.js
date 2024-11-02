import React, { useState, useContext } from 'react';
import { loginUser } from '../api'; // Import the API call from api.js
import { useAppContext, ACTIONS } from './App'; // Import context and actions
import './Auth.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { dispatch } = useAppContext(); // Access the context to dispatch actions
    const navigate = useNavigate(); // Initialize the useNavigate hook

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await loginUser(username, password); // Use the API function
            const token = response.token; // Extract the token from response
            localStorage.setItem('token', token); // Store the token in local storage
            setMessage('Login successful');
            
            // Dispatch action to set loggedIn state
            dispatch({ type: ACTIONS.SET_LOGGED_IN, payload: true });
            // Redirect to SendMessage or QRCodeScanner based on your logic
            navigate('/home'); // Redirect to home page after successful login
        } catch (error) {
            setMessage(error.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleLogin}>
                <h2>Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
}

export default Login;
