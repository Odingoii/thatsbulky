import React, { useReducer, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import axios from 'axios';
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

const BASE_URL = 'https://thatsbulky.com:3000';


// Create a context for the app state
const AppContext = createContext();

// Action types for the reducer
export const ACTIONS = {
    SET_LOGGED_IN: 'SET_LOGGED_IN',
    SET_LOADING: 'SET_LOADING',
    SET_ACTIVE_PAGE: 'SET_ACTIVE_PAGE',
    SET_REDIRECT: 'SET_REDIRECT',
    SET_SHOW_LOGIN: 'SET_SHOW_LOGIN',
};

// Initial state for the reducer
const initialState = {
    loggedIn: false,
    loading: true,
    activePage: 'loading',
    redirectToSendMessage: false,
    showLogin: true, // Controls whether to show login or signup
};

// Reducer function to manage state transitions
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

// Custom hook to use the AppContext
export const useAppContext = () => useContext(AppContext);

function App() {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Function to fetch login status and update app state
    const fetchLoginStatus = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/status`);
            const { status } = response.data;

            if (!status) {
                dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'loading' });
            } else {
                switch (status) {
                    case 'loggedOut':
                        dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'qr-code-updated' });
                        break;
                    case 'loggedIn':
                        dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'sendMessage' });
                        dispatch({ type: ACTIONS.SET_LOGGED_IN, payload: true });
                        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
                        break;
                    default:
                        dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'loading' });
                        dispatch({ type: ACTIONS.SET_LOGGED_IN, payload: false });
                }
            }
        } catch (error) {
            console.error('Error fetching login status:', error);
            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
    };

    useEffect(() => {
        const pollLoginStatus = () => {
            fetchLoginStatus();
        };

        if (!state.loggedIn) {
            const interval = setInterval(pollLoginStatus, 15000);
            return () => clearInterval(interval);
        }
    }, [state.loggedIn]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            <Router>
                <div className="app-frame">
                    {state.loading && <LoadingSpinner />}

                    {/* Show Signup or Login if user is not logged in */}
                    {!state.loggedIn && (
                        <div className="auth-container">
                            {state.showLogin ? (
                                <Login />
                            ) : (
                                <Signup />
                            )}
                            <button 
                                className="auth-toggle-btn" 
                                onClick={() => dispatch({ type: ACTIONS.SET_SHOW_LOGIN, payload: !state.showLogin })}
                            >
                                {state.showLogin ? 'Create an Account' : 'Already have an account? Log in'}
                            </button>
                        </div>
                    )}

                    {/* Main App Content with Routing */}
                    {state.loggedIn && (
                        <Switch>
                            <Route path={["/home", "/"]} exact>
                                <>
                                    <QRCodeScanner />
                                    <div className={`content-wrapper ${state.loading ? 'blurred' : ''}`}>
                                        <Sidebar disabled={state.loading} />
                                        <div className="main-content">
                                            <SendMessage />
                                            <GroupView />
                                            <ContactSelection />
                                            <GroupDetail groupId={state.redirectToSendMessage} />
                                        </div>
                                    </div>
                                </>
                            </Route>
                            <Redirect from="/" to="/home" />
                        </Switch>
                    )}
                </div>
            </Router>
        </AppContext.Provider>
    );
}
