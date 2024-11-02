// Signup.js
import React, { useState } from 'react';
import { registerUser } from '../api'; // Import the API call from api.js
import './Auth.css';

function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await registerUser(username, password); // Use the API function
            setMessage(response.message || 'Sign up successful');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Sign up failed');
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSignup}>
                <h2>Sign Up</h2>
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
                <button type="submit">Sign Up</button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
}
const handleSubmit = async () => {
    // registration logic...
    onSuccess(); // Call this to switch to login after successful signup
}
export default Signup;
