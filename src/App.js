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
import './App.css';

// Create a context for the app
const AppContext = createContext();

// Action types
export const ACTIONS = {
    SET_LOGGED_IN: 'SET_LOGGED_IN',
    SET_LOADING: 'SET_LOADING',
    SET_ACTIVE_PAGE: 'SET_ACTIVE_PAGE',
};

// Initial state
const initialState = {
    loggedIn: false,
    loading: true,
    activePage: 'loading',
};

// Reducer function to manage state
function appReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_LOGGED_IN:
            return { ...state, loggedIn: action.payload };
        case ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload };
        case ACTIONS.SET_ACTIVE_PAGE:
            return { ...state, activePage: action.payload, loading: false };
        default:
            return state;
    }
}

// Custom hook to use the app context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

function App() {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Function to handle login status
    const handleLoginStatus = async () => {
        try {
            const { status } = await fetchLoginStatusApi();

            if (!status) {
                dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'loading' });
            } else if (status === 'loggedOut') {
                dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'qr-code' });
            } else if (status === 'loggedIn') {
                dispatch({ type: ACTIONS.SET_LOGGED_IN, payload: true });
                dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'sendMessage' });
            }
        } catch (error) {
            console.error('Error fetching login status:', error);
            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
    };

    useEffect(() => {
        handleLoginStatus(); // Initial check on mount

        const interval = setInterval(() => {
            if (!state.loggedIn) {
                handleLoginStatus(); // Poll login status if not logged in
            }
        }, 15000); // Poll every 15 seconds

        return () => clearInterval(interval);
    }, [state.loggedIn]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            <Router>
                <div className="app-frame">
                    {state.loading && <LoadingSpinner />}
                    {state.activePage === 'qr-code' && <QRCodeScanner />}

                    {/* Render sidebar and main content when not loading or showing QR code */}
                    {!state.loading && state.activePage !== 'qr-code' && (
                        <div className="main-content">
                            <Sidebar disabled={state.loading} />
                            <div className="content-area">
                                <Routes>
                                    <Route path="/" element={<SendMessage />} />
                                    <Route path="/sendMessage" element={<SendMessage />} />
                                    <Route path="/contacts" element={<ContactSelection />} />
                                    <Route path="/group" element={<GroupView />} />
                                    <Route path="/group/:id" element={<GroupDetail />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Routes>
                            </div>
                        </div>
                    )}
                </div>
            </Router>
        </AppContext.Provider>
    );
}

export default App;
