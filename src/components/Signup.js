// Signup.js
import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/register', { username, password });
            setMessage(response.data.message || 'Sign up successful');
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

export default Signup;
