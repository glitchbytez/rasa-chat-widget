// Main entry point for the react-chat-widget package
import './components/ChatWidget.css';

export { default as ChatWidget } from './components/ChatWidget.jsx';
export { default as ChatWidgetProvider } from './components/ChatWidgetProvider.jsx';
export { SocketProvider, useSocket } from './context/SocketContext.js';
export { default as useSendMessage } from './hooks/useSendMessage.js';
export { default as chatStore } from './stores/chatStore.js';

// Re-export everything for convenience
export * from './components/ChatWidget.jsx';
export * from './components/ChatWidgetProvider.jsx';
export * from './context/SocketContext.js';
export * from './hooks/useSendMessage.js';
export * from './stores/chatStore.js'; 