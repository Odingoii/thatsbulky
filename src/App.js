import React, { useReducer, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { fetchLoginStatus as fetchLoginStatusApi } from './api'; 
import QRCodeScanner from './components/QRCodeScanner';
import Sidebar from './components/Sidebar';
import GroupView from './components/GroupView';
import SendMessage from './components/SendMessage';
import ContactSelection from './components/ContactSelection';
import LoadingSpinner from './components/LoadingSpinner';
import GroupDetail from './components/GroupDetail';
import Signup from './components/Signup';
import Login from './components/Login';
import './App.css';

const AppContext = createContext();

export const ACTIONS = {
    SET_LOGGED_IN: 'SET_LOGGED_IN',
    SET_LOADING: 'SET_LOADING',
    SET_ACTIVE_PAGE: 'SET_ACTIVE_PAGE',
    SET_REDIRECT: 'SET_REDIRECT',
    SET_SHOW_LOGIN: 'SET_SHOW_LOGIN',
};

const initialState = {
    loggedIn: false,
    loading: true,
    activePage: 'loading',
    redirectToSendMessage: false,
    showLogin: true,
};

function appReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_LOGGED_IN:
            return { ...state, loggedIn: action.payload };
        case ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload };
        case ACTIONS.SET_ACTIVE_PAGE:
            return { ...state, activePage: action.payload, loading: false };
        case ACTIONS.SET_REDIRECT:
            return { ...state, redirectToSendMessage: action.payload };
        case ACTIONS.SET_SHOW_LOGIN:
            return { ...state, showLogin: action.payload };
        default:
            return state;
    }
}

export const useAppContext = () => useContext(AppContext);

function App() {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const fetchLoginStatus = async () => {
        try {
            const response = await fetchLoginStatusApi(); 
            const { status } = response.data;

            if (!status) {
                dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'loading' });
            } else {
                if (status === 'loggedIn') {
                    dispatch({ type: ACTIONS.SET_LOGGED_IN, payload: true });
                    dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'sendMessage' });
                } else {
                    dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'qr-code-updated' });
                }
            }
        } catch (error) {
            console.error('Error fetching login status:', error);
            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
    };

    useEffect(() => {
        fetchLoginStatus();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (state.loggedIn) fetchLoginStatus();
        }, 15000);
        return () => clearInterval(interval);
    }, [state.loggedIn]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            <Router>
                <div className="app-frame">
                    {state.loading && <LoadingSpinner />}
                    {!state.loggedIn && (
                        <div className="auth-container">
                            {state.showLogin ? (
                                <Login />
                            ) : (
                                <Signup onSuccess={() => dispatch({ type: ACTIONS.SET_SHOW_LOGIN, payload: true })} />
                            )}
                            <button 
                                className="auth-toggle-btn" 
                                onClick={() => dispatch({ type: ACTIONS.SET_SHOW_LOGIN, payload: !state.showLogin })}
                            >
                                {state.showLogin ? 'Create an Account' : 'Already have an account? Log in'}
                            </button>
                        </div>
                    )}
                    {state.loggedIn && (
                        <Routes>
                            <Route path="/" element={<QRCodeScanner />} />
                            <Route path="/home" element={
                                <div className={`content-wrapper ${state.loading ? 'blurred' : ''}`}>
                                    <Sidebar disabled={state.loading} />
                                    <div className="main-content">
                                        <SendMessage />
                                        <GroupView />
                                        <ContactSelection />
                                        <GroupDetail groupId={state.redirectToSendMessage} />
                                    </div>
                                </div>
                            } />
                            <Route path="*" element={<Navigate to="/home" />} />
                        </Routes>
                    )}
                </div>
            </Router>
        </AppContext.Provider>
    );
}

export default App;
