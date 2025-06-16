import React, { useContext, useEffect } from 'react';
import { SocketProvider, useSocket } from '../context/SocketContext';
import ChatWidget from './ChatWidget.jsx';
import useChatStore from '../stores/chatStore';

/**
 * ChatWidgetProvider - A reusable wrapper component for the ChatWidget
 * 
 * This component is designed to be standalone and reusable across different applications.
 * It includes its own SocketProvider to handle chat connections.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.socketConfig - Configuration for the socket connections
 * @param {string} props.socketConfig.rasaServerUrl - URL for the Rasa server
 * @param {string} props.socketConfig.socketPath - Socket.io path
 * @param {string} props.socketConfig.botMessageEvent - Event name for bot messages
 * @param {string} props.socketConfig.userMessageEvent - Event name for user messages
 * @param {string} props.socketConfig.dashboardServerUrl - URL for the dashboard server
 * @param {string} props.feedbackEndpoint - URL for the feedback submission API endpoint
 * @param {string} props.initialPosition - Initial position of the widget: "bottom-right", "bottom-center", or "bottom-left"
 * @param {boolean} props.useExistingSocketContext - If true, will use an existing SocketProvider from a parent component if available
 */
export default function ChatWidgetProvider({
    socketConfig = {},
    useExistingSocketContext = false,
    feedbackEndpoint = 'http://localhost:5500/api/v1/feedback/public',
    initialPosition = 'bottom-right'
}) {
    // Try to get existing socket context
    let existingContext;
    try {
        existingContext = useSocket();
    } catch (error) {
        // No existing context found, which is fine
        existingContext = null;
    }
    
    // Set the feedback endpoint and initial position in the store
    useEffect(() => {
        const store = useChatStore.getState();
        store.setFeedbackEndpoint(feedbackEndpoint);
        store.setWidgetPosition(initialPosition);
    }, [feedbackEndpoint, initialPosition]);

    // If we have an existing context and we want to use it, just render the ChatWidget
    if (existingContext && useExistingSocketContext) {
        return <ChatWidget />;
    }
    
    // Otherwise, provide our own SocketProvider
    // This makes the component fully standalone and reusable
    return (
        <SocketProvider config={socketConfig}>
            <ChatWidget />
        </SocketProvider>
    );
}
