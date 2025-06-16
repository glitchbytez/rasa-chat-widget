import useChatStore from '../stores/chatStore';
import { useSocket } from '../context/SocketContext';

export const useSendMessage = () => {
    const { socket, sessionId, addMessage, setLoading, setIsTyping, dashboardSocket, isLiveChatActive } = useChatStore.getState();
    const socketContext = useSocket();
    
    // Make sure we have access to socketConfig
    const socketConfig = socketContext?.socketConfig || {
        userMessageEvent: 'user_uttered',  // Fallback to default value
        botMessageEvent: 'bot_uttered'
    };

    const sendMessage = (text) => {
        if (!socket || !socket.connected) {
            addMessage({
                id: 'error-' + Date.now(),
                role: 'system',
                content: 'Not connected to the chat server.',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (!text.trim()) return;

        if (isLiveChatActive) {
            console.warn('Live chat expected but no connection - falling back to bot');
            addMessage({
                id: 'error-' + Date.now(),
                role: 'system',
                content: 'Temporarily sending to bot while connecting to agent...'
            });
        }
        const userMessage = {
            id: 'user-' + Date.now(),
            role: 'user',
            type: 'text',
            content: text.trim(),
            timestamp: new Date().toISOString(),
        };

        addMessage(userMessage);
        setLoading(true);

        // Make sure we have the event name before emitting
        const eventName = socketConfig?.userMessageEvent || 'user_uttered';
        
        socket.emit(eventName, {
            message: text.trim(),
            session_id: sessionId,
        });
    };

    const sendMessageToDashboard = (text) => {
        if (!text.trim()) return;

        const userMessage = {
            id: 'user-' + Date.now(),
            role: 'user',
            type: 'text',
            content: text.trim(),
            timestamp: new Date().toISOString(),
        };

        addMessage(userMessage);
        // setLoading(true);

        dashboardSocket.emit('userMessage', {
            sessionId: sessionId,
            text: text.trim(),
        });
        console.log('input from usesendmsg is: ', text.trim());

    };

    return { sendMessage, sendMessageToDashboard };
};

export default useSendMessage;
