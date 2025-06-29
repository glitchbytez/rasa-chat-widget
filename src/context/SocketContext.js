import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import useChatStore from '../stores/chatStore';

// Error types for better error handling
const ERROR_TYPES = {
    CONNECTION: 'connection_error',
    TIMEOUT: 'timeout_error',
    SERVER: 'server_error',
    NETWORK: 'network_error',
    UNKNOWN: 'unknown_error'
};

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

// Default configuration values
const DEFAULT_CONFIG = {
    rasaServerUrl: "http://localhost:5005",
    socketPath: "/socket.io",
    botMessageEvent: "bot_uttered",
    userMessageEvent: "user_uttered",
    dashboardServerUrl: "http://localhost:5501"
};

// Utility function to log errors and optionally report to monitoring service
const logError = (error, context = {}) => {
    console.error(`[ERROR] ${context.type || 'Unknown error'}:`, error);
    
    // In production, you would send this to your error monitoring service
    // Example: Sentry.captureException(error, { extra: context });
    
    // Return the error for chaining
    return error;
};

// Utility to check if code is running in browser environment
const isBrowser = typeof window !== 'undefined';

export const SocketProvider = ({ 
    children, 
    config = {} 
}) => {
    // Network status monitoring - default to true if not in browser
    const [isOnline, setIsOnline] = useState(isBrowser ? navigator.onLine : true);
    
    // Merge provided config with defaults
    const socketConfig = {
        ...DEFAULT_CONFIG,
        ...config
    };
    
    // Maximum number of reconnection attempts
    const MAX_RECONNECT_ATTEMPTS = 5;
    
    // Track reconnection attempts
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const {
        setSocket,
        setSessionId,
        addMessage,
        setLoading,
        sessionId,
        socket,
        setDashboardSocket,
        dashboardSocket,
        setConnected,
        agentName,
        setAgentName,
        setIsTyping,
        isLiveChatActive,
        setIsLiveChatActive,
        initiateHandoff,
        startNewChat,
        lastChatState,
        connectionErrorShown,
        setConnectionErrorShown,
        resetConnectionErrorShown,
        dashboardConnectionErrorShown,
        setDashboardConnectionErrorShown,
        resetDashboardConnectionErrorShown,
    } = useChatStore();

    // Monitor network status changes
    useEffect(() => {
        // Skip if not in browser environment
        if (!isBrowser) return;
        
        const handleOnline = () => {
            console.log('🌐 Network connection restored');
            setIsOnline(true);
            
            // Attempt to reconnect sockets when network comes back online
            if (sessionId) {
                // Reset reconnection attempts
                setReconnectAttempts(0);
                
                // Try to reconnect to appropriate services based on last state
                const currentState = useChatStore.getState();
                if (currentState.lastChatState === 'live_agent') {
                    connectToDashboard();
                } else {
                    // Socket will auto-reconnect if configured with reconnection: true
                }
                
                // Notify user that we're reconnecting
                useChatStore.getState().addMessage({
                    id: 'network-reconnect-' + Date.now(),
                    role: 'system',
                    content: 'Network connection restored. Reconnecting...',
                    timestamp: new Date().toISOString(),
                });
            }
        };
        
        const handleOffline = () => {
            console.log('🔌 Network connection lost');
            setIsOnline(false);
            
            // Notify user about network issues
            useChatStore.getState().addMessage({
                id: 'network-offline-' + Date.now(),
                role: 'system',
                content: 'Network connection lost. Messages may not be delivered until connection is restored.',
                timestamp: new Date().toISOString(),
            });
        };
        
        // Add event listeners for online/offline status
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Clean up event listeners on unmount
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [sessionId]);

    useEffect(() => {
        // Skip if not in browser environment
        if (!isBrowser) return;
        
        try {
            let storedSessionId = localStorage.getItem("rasaSessionId");
            if (!storedSessionId) {
                storedSessionId = uuidv4();
                localStorage.setItem("rasaSessionId", storedSessionId);
            }
            setSessionId(storedSessionId);
        } catch (error) {
            // Handle localStorage access errors (e.g., private browsing mode)
            logError(error, { type: ERROR_TYPES.UNKNOWN, context: 'sessionId-initialization' });
            
            // Fallback to in-memory session ID
            const fallbackSessionId = uuidv4();
            setSessionId(fallbackSessionId);
            
            console.warn('Using fallback in-memory session ID due to localStorage access error');
        }
    }, [setSessionId]);

    // Reconnect to appropriate server on page reload based on last chat state
    useEffect(() => {
        const reconnectBasedOnState = async () => {
            // If there was an active session before reload
            if (lastChatState) {
                if (lastChatState === 'live_agent') {
                    // If user was chatting with a live agent, just reconnect without showing a message
                    // We'll show a single "Connected to live agent" message in the connectToDashboard function
                    await connectToDashboard();
                } else {
                    // If user was chatting with the bot, just reconnect without showing a message
                    // We'll handle the connection message in the socket connection
                }
            }
        };

        // Only run this effect when the component mounts (on page load)
        if (sessionId && !socket) {
            reconnectBasedOnState();
        }
    }, [sessionId, isOnline, socketConfig, socket]);

    const connectToDashboard = (agentName, userEmail, userName) => {
        // log details for debugging
        console.log('Connecting to dashboard with agentName:', agentName, 'userEmail:', userEmail, 'userName:', userName);
        
        // Skip if not in browser
        if (!isBrowser) {
            console.warn('Cannot connect to dashboard: Not in browser environment');
            return;
        }
        
        if (!sessionId) {
            console.warn('Cannot connect to dashboard: No session ID available');
            return;
        }

        if (!isOnline) {
            console.warn('Cannot connect to dashboard: Network is offline');
            useChatStore.getState().addMessage({
                id: 'network-offline-dashboard-' + Date.now(),
                role: 'system',
                content: 'Cannot connect to live agent while offline. Please check your internet connection.',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Use getState() to get fresh values
        const currentState = useChatStore.getState();

        if (currentState.dashboardSocket?.connected) {
            console.log('Dashboard connection already established');
            return;
        }
        
        // Set the connecting flag to true to disable the input box
        useChatStore.getState().setIsConnectingToLiveAgent(true);

        // Implement connection timeout
        let connectionTimeoutId;

        try {
            console.log('🔌 Establishing new dashboard connection...');
            const dashboardSocketConnection = io(socketConfig.dashboardServerUrl, {
                reconnection: true,
                reconnectionAttempts: 3, // Reduce attempts to fit within 10 seconds
                reconnectionDelay: 1000, // Start with 1 second delay
                reconnectionDelayMax: 3000, // Maximum delay of 3 seconds
                timeout: 10000, // 10 second timeout to match our threshold
            });
            
            // Connection established handler
            dashboardSocketConnection.on('connect', () => {
            console.log('✅ Dashboard connection successful');
            useChatStore.getState().setDashboardSocket(dashboardSocketConnection);
            useChatStore.getState().setConnected(true);
            useChatStore.getState().setIsLiveChatActive(true);
            
            // Reset the connecting flag when connection succeeds
            useChatStore.getState().setIsConnectingToLiveAgent(false);
            
            // Reset the dashboard connection error shown flag when we successfully connect
            useChatStore.getState().resetDashboardConnectionErrorShown();

            // Register with the dashboard
            dashboardSocketConnection.emit('register', {
                role: 'user',
                sessionId: currentState.sessionId,
                userEmail: userEmail,
                userName: userName
            });

            // Show a simple "Connected to live agent" message if there isn't already one
            if (!currentState.messages.some(msg => 
                msg.role === 'system' && 
                msg.content.includes('Connected to live agent')
            )) {
                addMessage({
                    id: 'agent-connect-' + Date.now(),
                    role: 'system',
                    content: 'Connected to live agent.',
                    timestamp: new Date().toISOString(),
                });
            }
        });

        // Add agent typing event handler
        dashboardSocketConnection.on('agentTyping', ({sessionId}) => {
            console.log('👨‍💼 Agent is typing...');
            useChatStore.getState().setIsTyping(true);
            
            // Auto-reset typing indicator after a timeout (in case the stop typing event is missed)
            setAgentName(agentName);
            addMessage({
                id: 'agent-joined-' + Date.now(),
                role: 'system',
                content: `${agentName} has joined the conversation`,
                timestamp: new Date().toISOString(),
            });
        });

        // Set timeout for connection - this is a backup in case socket.io's own timeout doesn't trigger
        const connectionTimeout = setTimeout(() => {
            if (!dashboardSocketConnection.connected) {
                console.warn('⌛ Dashboard connection timeout');
                // Force disconnect after our 10-second threshold
                dashboardSocketConnection.disconnect();
                setIsLiveChatActive(false);
                setConnected(false);
                
                // Reset the connecting flag since we're forcing a disconnect
                useChatStore.getState().setIsConnectingToLiveAgent(false);
                
                // Add message about connection timeout
                addMessage({
                    id: 'timeout-error-' + Date.now(),
                    role: 'system',
                    content: 'Connection to live agent timed out after multiple attempts.',
                    timestamp: new Date().toISOString(),
                });
                
                // End the chat session after the timeout
                setTimeout(() => {
                    useChatStore.getState().setChatEnded(true);
                    useChatStore.getState().addMessage({
                        id: 'system-' + Date.now(),
                        role: 'system',
                        content: 'The chat session has ended.',
                        timestamp: new Date().toISOString(),
                    });
                }, 2000); // Wait 2 seconds before ending the chat
            }
        }, 10000); // 10 second timeout to match our threshold

        // Cleanup on successful connection
        dashboardSocketConnection.on('connect', () => {
            clearTimeout(connectionTimeout);
        });

        dashboardSocketConnection.on('agentMessage', (agentMessage) => {
            console.log("Received agent message:", agentMessage);
            setIsTyping(false);
            addMessage({
                id: uuidv4(),
                role: 'agent',
                type: 'text',
                content: agentMessage.text,
                timestamp: new Date().toISOString(),
            });
        });

        // Handle when an agent ends the conversation (legacy event)
        dashboardSocketConnection.on('conversationEnded', (data) => {
            console.log('Agent ended the conversation (conversationEnded):', data);
            
            // Add message to notify the user
            addMessage({
                id: 'conversation-ended-' + Date.now(),
                role: 'system',
                content: data.message || 'The agent has ended this conversation.',
                timestamp: new Date().toISOString(),
            });
            
            // End the live chat session
            useChatStore.getState().endExistingLiveChat();
        });
        
        // Handle the new endConversation event from dashboard
        dashboardSocketConnection.on('endConversation', (data) => {
            console.log('Agent ended the conversation (endConversation):', data);
            
            // Add message to notify the user
            addMessage({
                id: 'conversation-ended-' + Date.now(),
                role: 'system',
                content: 'The agent has ended this conversation.',
                timestamp: new Date().toISOString(),
            });
            
            // End the live chat session
            useChatStore.getState().endExistingLiveChat();
        });

        dashboardSocketConnection.on('disconnect', () => {
            console.log('Disconnected from dashboard server');
            // useChatStore.getState().endLiveChat();
        });
        
        // Handle connection errors
        dashboardSocketConnection.on('connect_error', (error) => {
            console.error('❌ Dashboard connection failed:', error);
            setIsLiveChatActive(false);
            setConnected(false);
            
            // Only add the message if we haven't shown it yet
            const { dashboardConnectionErrorShown, setDashboardConnectionErrorShown } = useChatStore.getState();
            
            if (!dashboardConnectionErrorShown) {
                // Add message about connection failure
                addMessage({
                    id: 'connect-error-' + Date.now(),
                    role: 'system',
                    content: 'Failed to connect to live agent. Attempting to reconnect...',
                    timestamp: new Date().toISOString(),
                });
                
                setDashboardConnectionErrorShown(true);
            }
            // Note: We don't reset isConnectingToLiveAgent here as we're still attempting to reconnect
        });
        
        // Handle when all reconnection attempts fail
        dashboardSocketConnection.on('reconnect_failed', () => {
            console.error('❌ All dashboard reconnection attempts failed');
            
            // Reset the connecting flag when all reconnection attempts fail
            useChatStore.getState().setIsConnectingToLiveAgent(false);
            
            // Always show the reconnection failure message
            addMessage({
                id: 'reconnect-failed-' + Date.now(),
                role: 'system',
                content: 'Failed to connect to live agent after multiple attempts.',
                timestamp: new Date().toISOString(),
            });
            
            // Automatically end the chat after displaying the error message
            setTimeout(() => {
                // End the chat session
                useChatStore.getState().setChatEnded(true);
                useChatStore.getState().addMessage({
                    id: 'system-' + Date.now(),
                    role: 'system',
                    content: 'The chat session has ended.',
                    timestamp: new Date().toISOString(),
                });
            }, 2000); // Wait 2 seconds before ending the chat
        });

        setDashboardSocket(dashboardSocketConnection);
        
        } catch (error) {
            logError(error, { type: ERROR_TYPES.CONNECTION, context: 'dashboard-connection' });
            
            // Notify user about connection issues
            useChatStore.getState().addMessage({
                id: 'connection-error-' + Date.now(),
                role: 'system',
                content: 'Failed to connect to live agent server. Please try again later.',
                timestamp: new Date().toISOString(),
            });
            
            // Update UI state
            setIsLiveChatActive(false);
            setConnected(false);
            setDashboardConnectionErrorShown(true);
        }
    };

    const disconnectFromDashboard = () => {
        if (dashboardSocket) {
            dashboardSocket.disconnect();
            setDashboardSocket(null);
            setIsLiveChatActive(false);
            setConnected(false);
            console.log('Manually disconnected from Dashboard');
        }
    };

    // In your component or chat context
    const startChat = () => {
        // Generate new session ID
        const newSessionId = uuidv4();
        localStorage.setItem("rasaSessionId", newSessionId);
        
        // Clear previous chat
        startNewChat();
        
        // Reset chat ended flag
        useChatStore.getState().setChatEnded(false);

        // Get current socket state
        const { socket } = useChatStore.getState();
        
        // If there's an existing socket, disconnect it first
        if (socket) {
            console.log('Disconnecting existing socket before starting new chat');
            
            // Remove all socket listeners to prevent any further updates
            socket.off(socketConfig.botMessageEvent);
            socket.off('typing');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('reconnect_attempt');
            socket.off('reconnect_failed');
            
            // Disconnect the socket
            if (socket.connected) {
                socket.disconnect();
            }
            
            // Set socket to null to force a new connection
            setSocket(null);
        }
        
        // Set the new session ID
        setSessionId(newSessionId);
        
        // Create a new socket connection with the new session ID
        console.log('Creating new socket connection with session ID:', newSessionId);
        const socketConnection = io(socketConfig.rasaServerUrl, {
            path: socketConfig.socketPath,
            transports: ['websocket'],
            query: { session_id: newSessionId },
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            autoConnect: true,
            forceNew: true, // Ensure we create a new connection
        });
        
        // Set up event handlers for the new socket
        socketConnection.on('connect', () => {
            console.log('✅ Connected to Rasa server with new session');
            
            // Set the socket in the store
            setSocket(socketConnection);
            
            // First send session_request to establish the connection
            socketConnection.emit('session_request', { session_id: newSessionId });
            
            // Add a small delay before sending the first message to prevent race conditions
            setTimeout(() => {
                // Then explicitly send a restart command to Rasa
                console.log('Sending restart command to Rasa');
                socketConnection.emit(socketConfig.userMessageEvent, {
                    message: "/restart",
                    session_id: newSessionId
                });
                
                // Add another small delay before sending the session_start command
                setTimeout(() => {
                    // Then start a new session
                    console.log('Sending session_start command to Rasa');
                    socketConnection.emit(socketConfig.userMessageEvent, {
                        message: "/session_start",
                        session_id: newSessionId
                    });
                    
                    // We don't need to add a connection message here as it will be added by the useEffect hook
                    // when the socket connects
                }, 300); // 300ms delay before session_start
            }, 500); // 500ms delay before first command
        });
        
        // Set up other event handlers
        socketConnection.on('disconnect', (reason) => {
            console.warn("⚠️ Disconnected from Rasa:", reason);
        });
        
        socketConnection.on("connect_error", (error) => {
            console.error("❌ Connection Error:", error.message);
            
            // Only add the message if we haven't shown it yet
            const { connectionErrorShown, setConnectionErrorShown } = useChatStore.getState();
            
            if (!connectionErrorShown) {
                // Add the message and set the flag
                useChatStore.getState().addMessage({
                    id: 'error-' + Date.now(),
                    role: 'system',
                    content: 'Unable to reach chat server. Retrying...',
                    timestamp: new Date().toISOString(),
                });
                
                setConnectionErrorShown(true);
            }
        });
        
        // Set up bot message handler
        socketConnection.on(socketConfig.botMessageEvent, (botResponse) => {
            setLoading(false);
            const idBase = uuidv4();

            console.log('Full bot response received:', botResponse);
            
            // Process bot response (simplified version)
            if (botResponse.text) {
                addMessage({
                    id: idBase,
                    role: 'assistant',
                    type: 'text',
                    content: botResponse.text,
                    timestamp: new Date().toISOString(),
                });
            }
        });
        
        // Connect the socket
        socketConnection.connect();
    };

    // In your component or chat context
    const endLiveChat = async () => {
        const { endExistingLiveChat, socket, sessionId } = useChatStore.getState();

        // 1. Notify dashboard server
        if (dashboardSocket?.connected) {
            dashboardSocket.emit('endChat', { sessionId });
        }

        // 2. Update local state
        endExistingLiveChat();

        // 3. Restart conversation with bot
        if (socket && sessionId) {
            try {
                // Send restart command
                await socket.emit(socketConfig.userMessageEvent, {
                    message: "/restart",
                    session_id: sessionId
                });

            } catch (error) {
                console.error('Failed to restart conversation:', error);
            }
        }
    };

    // End bot chat session with Rasa
    const endBotChat = async () => {
        // Force immediate update of all relevant state
        useChatStore.setState({
            isTyping: false,
            isLoading: false
        });
        
        const { socket, sessionId } = useChatStore.getState();
        
        if (socket && sessionId) {
            try {
                // First, try to send the session_end command directly if socket is connected
                // This ensures Rasa knows the session has ended
                if (socket.connected) {
                    console.log('Sending session_end command to Rasa before disconnecting');
                    socket.emit(socketConfig.userMessageEvent, {
                        message: "/session_end",
                        session_id: sessionId
                    });
                }
                
                // Remove all socket listeners to prevent any further updates
                socket.off(socketConfig.botMessageEvent);
                socket.off('typing');
                
                // Forcefully disconnect the socket to terminate any ongoing bot replies
                console.log('Forcefully disconnecting socket to terminate ongoing bot replies');
                socket.disconnect();
                
                // Set a flag to indicate the chat has been ended
                useChatStore.getState().setChatEnded(true);
                console.log('Bot chat session ended and reset');
                
                // Don't automatically reconnect - we'll reconnect with a new session when startChat is called
            } catch (error) {
                console.error('Failed to end bot conversation:', error);
            }
        }
    };

    useEffect(() => {
        // Skip if not in browser environment
        if (!isBrowser) return;
        
        if (!sessionId) return;
        
        // Don't attempt connection if we're offline
        if (!isOnline) {
            console.warn('Not connecting to Rasa server: Network is offline');
            return;
        }
        
        // Check if we already have an active socket connection
        if (socket && socket.connected) {
            console.log('🔄 Using existing socket connection');
            return;
        }
        
        let socketConnection;
        
        try {
            socketConnection = io(socketConfig.rasaServerUrl, {
                path: socketConfig.socketPath,
                transports: ['websocket'],
                query: { session_id: sessionId },
                reconnection: true,
                reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                timeout: 20000,
                // Add additional error handling options
                autoConnect: true,
                forceNew: true, // Ensure we create a new connection
            });
            
            socketConnection.on('connect', () => {
            console.log('✅ Connected to Rasa server');
            
            // Reset the connection error shown flag when we successfully connect
            useChatStore.getState().resetConnectionErrorShown();
            
            // Set the socket in the store
            setSocket(socketConnection);
            
            // If we have a session ID, use it, otherwise create a new one
            const sessionId = useChatStore.getState().sessionId || uuidv4();
            setSessionId(sessionId);
            
            console.log(`📝 Session ID: ${sessionId}`);
            
            // Send session request to the server
            socketConnection.emit('session_request', { session_id: sessionId });
            
            // Check if this is a reconnection after page reload
            const currentState = useChatStore.getState();

            // Only show connection message if not in live agent mode and if there isn't already one
            if (currentState.lastChatState !== 'live_agent' && 
                !currentState.messages.some(msg => 
                    msg.role === 'system' && 
                    msg.content.includes('Connected to chat server')
                )) {
                addMessage({
                    id: 'system-' + Date.now(),
                    role: 'system',
                    content: 'Connected to chat server.',
                    timestamp: new Date().toISOString(),
                });
            }
        });

        socketConnection.on('disconnect', (reason) => {
            console.warn("⚠️ Disconnected from Rasa:", reason);
            if (reason === "io server disconnect") {
                socketConnection.connect();
            }
            // Don't start a new chat on disconnect to preserve messages
            // useChatStore.getState().startNewChat();
        });

        socketConnection.on("connect_error", (error) => {
            console.error("❌ Connection Error:", error.message);
            
            // Only add the message if we haven't shown it yet
            const { connectionErrorShown, setConnectionErrorShown } = useChatStore.getState();
            
            if (!connectionErrorShown) {
                // Add the message and set the flag
                useChatStore.getState().addMessage({
                    id: 'error-' + Date.now(),
                    role: 'system',
                    content: 'Unable to reach chat server. Retrying...',
                    timestamp: new Date().toISOString(),
                });
                
                setConnectionErrorShown(true);
            }
        });

        socketConnection.on("reconnect_attempt", (attempt) => {
            console.log(`🔁 Reconnect attempt #${attempt}`);
        });

        socketConnection.on("reconnect_failed", () => {
            console.error("❌ Reconnection failed. Giving up.");
            useChatStore.getState().addMessage({
                id: 'system-fail-' + Date.now(),
                role: 'system',
                content: 'Failed to reconnect to chat server. Please refresh the page.',
                timestamp: new Date().toISOString(),
            });
        });

        socketConnection.on(socketConfig.botMessageEvent, (botResponse) => {
            setLoading(false);
            const idBase = uuidv4();

            console.log('Full bot response received:', botResponse); // Detailed logging
            // Handle resume responses

            // Enhanced handoff detection - checks multiple possible formats
            if (botResponse.handoff === true) {
                // user email
                const userEmail = botResponse.user_email ? botResponse.user_email : null;

                //user name
                const userName = botResponse.user_name ? botResponse.user_name : null;
                // Use getState() to get fresh values
                const currentState = useChatStore.getState();

                console.log('🚀 HANDOFF TRIGGERED - Starting handoff process');

                // Set state and connect in sequence
                useChatStore.getState().setIsLiveChatActive(true);

                // Add slight delay to ensure state updates
                setTimeout(() => {
                    connectToDashboard(currentState.agentName, userEmail, userName);

                    // Add handoff message to chat
                    if (botResponse.message || botResponse.text) {
                        addMessage({
                            id: idBase,
                            role: 'assistant',
                            type: 'text',
                            content: botResponse.message || botResponse.text,
                            timestamp: new Date().toISOString(),
                        });
                    }

                    // Don't add a "Connected to live agent" message here
                    // as it will be added by the connectToDashboard function

                }, 50);

                return;
            }


            // Normal bot message processing
            if (botResponse.text) {
                addMessage({
                    id: idBase,
                    role: 'assistant',
                    type: 'text',
                    content: botResponse.text,
                    timestamp: new Date().toISOString(),
                });
            }

            if (botResponse.buttons || botResponse.quick_replies) {
                const buttons = botResponse.buttons || botResponse.quick_replies;
                addMessage({
                    id: idBase + '-buttons',
                    role: 'assistant',
                    type: 'buttons',
                    payload: buttons.map(btn => ({
                        title: btn.title || btn.text,
                        payload: btn.payload || btn.title || btn.text
                    })),
                    timestamp: new Date().toISOString(),
                });
            }

            if (botResponse.image) {
                addMessage({
                    id: idBase + '-image',
                    role: 'assistant',
                    type: 'image',
                    content: botResponse.image,
                    timestamp: new Date().toISOString(),
                });
            }

            if (botResponse.custom) {
                addMessage({
                    id: idBase + '-custom',
                    role: 'assistant',
                    type: 'custom',
                    payload: botResponse.custom,
                });
            }
        });

        socketConnection.on(socketConfig.userMessageEvent, (userMessage) => {
            console.log("📨 Received user message:", userMessage);
            addMessage({
                id: uuidv4(),
                role: 'user',
                type: 'text',
                content: userMessage.text,
                timestamp: new Date().toISOString(),
            });
        });

        setSocket(socketConnection);

        return () => {
            // Clean up socket on unmount
            if (socketConnection) {
                console.log('🧹 Cleaning up socket connection');
                socketConnection.off(socketConfig.botMessageEvent);
                socketConnection.off(socketConfig.userMessageEvent);
                socketConnection.off('connect');
                socketConnection.off('disconnect');
                socketConnection.off('connect_error');
                socketConnection.off('reconnect_attempt');
                socketConnection.off('reconnect_failed');
                socketConnection.disconnect();
            }
        };
        
        } catch (error) {
            // Log the error with context
            logError(error, { type: ERROR_TYPES.CONNECTION, context: 'rasa-server-connection' });
            
            // Notify user about connection issues if not already shown
            if (!connectionErrorShown) {
                useChatStore.getState().addMessage({
                    id: 'rasa-error-' + Date.now(),
                    role: 'system',
                    content: 'Unable to connect to chat server. Please check your internet connection or try again later.',
                    timestamp: new Date().toISOString(),
                });
                
                setConnectionErrorShown(true);
            }
            
            // Increment reconnection attempts
            setReconnectAttempts(prev => prev + 1);
            
            // If we've exceeded max reconnection attempts, show a more permanent error
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                useChatStore.getState().addMessage({
                    id: 'rasa-max-attempts-' + Date.now(),
                    role: 'system',
                    content: 'Unable to establish a connection after multiple attempts. Please refresh the page or try again later.',
                    timestamp: new Date().toISOString(),
                });
            }
        }
    }, [sessionId, setSocket, addMessage, setLoading, isOnline, connectionErrorShown, reconnectAttempts]);

    // Enhanced message sending with error handling
    const sendMessage = async (message) => {
        // Skip if not in browser environment
        if (!isBrowser) {
            console.warn('Cannot send message: Not in browser environment');
            return false;
        }
        
        if (!isOnline) {
            // Handle offline state
            console.warn('Cannot send message while offline');
            useChatStore.getState().addMessage({
                id: 'offline-warning-' + Date.now(),
                role: 'system',
                content: 'Message could not be sent. You appear to be offline.',
                timestamp: new Date().toISOString(),
            });
            return false;
        }
        
        const { socket, dashboardSocket, sessionId, isLiveChatActive } = useChatStore.getState();
        
        try {
            if (isLiveChatActive && dashboardSocket?.connected) {
                // Send to live agent
                dashboardSocket.emit('userMessage', {
                    text: message,
                    sessionId: sessionId
                });
                return true;
            } else if (socket?.connected) {
                // Send to bot
                socket.emit(socketConfig.userMessageEvent, {
                    message: message,
                    session_id: sessionId
                });
                return true;
            } else {
                throw new Error('No active connection available');
            }
        } catch (error) {
            logError(error, { 
                type: ERROR_TYPES.CONNECTION, 
                context: 'message-sending',
                message: message
            });
            
            // Add error message to chat
            useChatStore.getState().addMessage({
                id: 'send-error-' + Date.now(),
                role: 'system',
                content: 'Message could not be delivered. Please check your connection and try again.',
                timestamp: new Date().toISOString(),
            });
            
            return false;
        }
    };
    
    // Function to handle unexpected errors
    const handleUnexpectedError = (error, context = {}) => {
        logError(error, { type: ERROR_TYPES.UNKNOWN, ...context });
        
        // Add user-friendly error message
        useChatStore.getState().addMessage({
            id: 'unexpected-error-' + Date.now(),
            role: 'system',
            content: 'Something went wrong. Please try again or refresh the page if the problem persists.',
            timestamp: new Date().toISOString(),
        });
    };

    return (
        <SocketContext.Provider value={{
            connectToDashboard,
            disconnectFromDashboard,
            startChat,
            endLiveChat,
            endBotChat,
            isLiveChatActive,
            sendMessage,
            handleUnexpectedError,
            isOnline
        }}>
            {children}
        </SocketContext.Provider>
    );
};