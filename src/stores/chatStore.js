import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChatStore = create(
    persist(
        (set) => ({
            socket: null,
            sessionId: null,
            messages: [],
            isLoading: false,
            isTyping: false,
            dashboardSocket: null,
            isConnected: false,
            agentName: null,
            isLiveChatActive: false,
            lastChatState: null, // To track if user was with bot or live agent
            chatEnded: false, // To track if the chat session has ended
            
            // Migrated states from chat-widget
            isOpen: false,
            widgetPosition: "bottom-right",
            isFullscreen: false,
            activeTab: "home",
            input: "",
            chatActive: true,
            menuOpen: false,
            isMobile: false,
            showConfirmation: false,
            showFeedback: false,
            feedbackRating: null,
            feedbackComment: "",
            feedbackSatisfied: null,
            unreadCount: 0,
            
            // Feedback submission states
            isFeedbackSubmitting: false,
            feedbackSubmissionStatus: null, // 'success', 'error', or null
            feedbackEndpoint: 'http://localhost:5500/api/v1/feedback/public', // Default endpoint
            
            // Flag to track if connection error message has been shown
            connectionErrorShown: false,
            // Flag to track if dashboard connection error message has been shown
            dashboardConnectionErrorShown: false,
            // Flag to track if we're currently attempting to connect to a live agent
            isConnectingToLiveAgent: false,

            // Actions
            setSocket: (socket) => set({ socket }),
            setDashboardSocket: (dashboardSocket) => set({ dashboardSocket }),
            setAgentName: (agentName) => set({ agentName }),
            setIsTyping: (isTyping) => set({ isTyping }),
            setIsLiveChatActive: (isLiveChatActive) => {
                console.log('Setting isLiveChatActive to:', isLiveChatActive); // Debug log
                set({ 
                    isLiveChatActive,
                    lastChatState: isLiveChatActive ? 'live_agent' : 'bot'
                });
            },
            setSessionId: (sessionId) => set({ sessionId }),
            setLoading: (isLoading) => set({ isLoading }),
            setConnected: (isConnected) => set({ isConnected }),
            setChatEnded: (chatEnded) => set({ chatEnded }),
            addMessage: (message) => set((state) => {
                // Check if this is a potential duplicate message
                // For bot messages, check if there's a recent identical message within the last 2 seconds
                if (message.role === 'assistant') {
                    const recentMessages = state.messages.filter(msg => 
                        msg.role === 'assistant' && 
                        msg.type === message.type && 
                        msg.content === message.content
                    );
                    
                    if (recentMessages.length > 0) {
                        // Get the most recent message timestamp
                        const lastMessageTime = new Date(recentMessages[recentMessages.length - 1].timestamp).getTime();
                        const currentMessageTime = new Date(message.timestamp).getTime();
                        
                        // If the message was received within 2 seconds, consider it a duplicate
                        if (currentMessageTime - lastMessageTime < 2000) {
                            console.log(' Prevented duplicate bot message:', message.content);
                            return { messages: state.messages }; // Return unchanged state
                        }
                    }
                }
                
                // Not a duplicate, add the message
                return { messages: [...state.messages, message] };
            }),
            clearMessages: () => set({ messages: [] }),
            
            // Set connection error shown flag
            setConnectionErrorShown: (shown) => set({ connectionErrorShown: shown }),
            
            // Reset connection error shown flag
            resetConnectionErrorShown: () => set({ connectionErrorShown: false }),
            
            // Set dashboard connection error shown flag
            setDashboardConnectionErrorShown: (shown) => set({ dashboardConnectionErrorShown: shown }),
            
            // Reset dashboard connection error shown flag
            resetDashboardConnectionErrorShown: () => set({ dashboardConnectionErrorShown: false }),
            
            // Set connecting to live agent flag
            setIsConnectingToLiveAgent: (isConnecting) => set({ isConnectingToLiveAgent: isConnecting }),

            // Migrated actions from chat-widget
            setIsOpen: (isOpen) => set((state) => {
                // When opening, reset unread count
                if (isOpen) {
                    return { isOpen, unreadCount: 0 };
                }
                return { isOpen };
            }),
            setWidgetPosition: (widgetPosition) => set({ widgetPosition }),
            setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
            setActiveTab: (activeTab) => set({ activeTab }),
            setInput: (input) => set({ input }),
            setChatActive: (chatActive) => set({ chatActive }),
            setMenuOpen: (menuOpen) => set({ menuOpen }),
            setIsMobile: (isMobile) => set({ isMobile }),
            setShowConfirmation: (showConfirmation) => set({ showConfirmation }),
            setShowFeedback: (showFeedback) => set({ showFeedback }),
            setFeedbackRating: (feedbackRating) => set({ feedbackRating }),
            setFeedbackComment: (feedbackComment) => set({ feedbackComment }),
            setFeedbackSatisfied: (feedbackSatisfied) => set({ feedbackSatisfied }),
            setUnreadCount: (unreadCount) => set({ unreadCount }),
            setFeedbackEndpoint: (feedbackEndpoint) => set({ feedbackEndpoint }),
            toggleWidget: () => set((state) => ({ isOpen: !state.isOpen, unreadCount: !state.isOpen ? 0 : state.unreadCount })),
            toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
            togglePosition: () => set((state) => {
                // Cycle through three positions: bottom-right -> bottom-center -> bottom-left -> bottom-right
                let newPosition;
                switch(state.widgetPosition) {
                    case "bottom-right":
                        newPosition = "bottom-center";
                        break;
                    case "bottom-center":
                        newPosition = "bottom-left";
                        break;
                    case "bottom-left":
                    default:
                        newPosition = "bottom-right";
                        break;
                }
                return { widgetPosition: newPosition };
            }),
            handleTabChange: (tab) => set({ activeTab: tab }),
            updateUnreadCount: () => set((state) => {
                if (!state.isOpen && state.messages.length > 1) {
                    // Count messages from assistant that might be unread
                    const assistantMessages = state.messages.filter((m) => m.role === "assistant").length;
                    return { unreadCount: assistantMessages > 0 ? 1 : 0 }; // Just show 1 as indicator
                } else {
                    // Reset unread count when widget is open
                    return { unreadCount: 0 };
                }
            }),
            handleInputChange: (e) => set({ input: e.target.value }),
            resetFeedbackState: () => set({
                feedbackRating: null,
                feedbackComment: "",
                feedbackSatisfied: null,
            }),
            submitFeedback: () => {
                const state = useChatStore.getState();
                
                // Set loading state
                set({ isFeedbackSubmitting: true, feedbackSubmissionStatus: null });
                
                // Prepare feedback data for API
                const feedbackData = {
                    sessionId: state.sessionId || 'anonymous-session',
                    rating: state.feedbackRating,
                    comment: state.feedbackComment,
                    satisfied: state.feedbackSatisfied
                };
                
                // Send feedback to backend API using the configurable endpoint
                fetch(state.feedbackEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(feedbackData),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Feedback submitted successfully:', data);
                    // Update state with success
                    set((state) => ({
                        isFeedbackSubmitting: false,
                        feedbackSubmissionStatus: 'success',
                        messages: [...state.messages, {
                            id: Date.now().toString(),
                            role: 'system',
                            content: 'Thank you for your feedback! Your chat session has ended.',
                            timestamp: new Date().toISOString(),
                        }]
                    }));
                    
                    // After showing success message for 2 seconds, complete the process
                    setTimeout(() => {
                        set({
                            showFeedback: false,
                            chatEnded: true,
                            feedbackSubmissionStatus: null
                        });
                    }, 2000);
                })
                .catch(error => {
                    console.error('Error submitting feedback:', error);
                    // Update state with error
                    set({
                        isFeedbackSubmitting: false,
                        feedbackSubmissionStatus: 'error'
                    });
                });
            },
            cancelFeedback: () => set((state) => ({
                showFeedback: false,
                chatEnded: true,
                messages: [...state.messages, {
                    id: Date.now().toString(),
                    role: 'system',
                    content: 'You have ended the chat session.',
                    timestamp: new Date().toISOString(),
                }]
            })),
            // We'll use a callback approach to avoid direct hook usage in the store
            handleConfirmEndChat: async (socketActions = null) => {
                // Immediately stop typing indicator
                set({ 
                    showConfirmation: false,
                    isTyping: false,
                    isLoading: false
                });
                
                const state = useChatStore.getState();
                
                try {
                    if (state.isLiveChatActive) {
                        // If we have socket actions passed from the component, use them
                        if (socketActions && socketActions.endLiveChat) {
                            console.log('Ending live chat session via passed socket actions');
                            await socketActions.endLiveChat();
                            // The endLiveChat function will handle the rest
                        } else {
                            console.warn('No socket actions available, falling back to direct state update');
                            // Fallback to direct state update
                            if (state.dashboardSocket) {
                                state.dashboardSocket.emit('endChat', { sessionId: state.sessionId });
                                state.dashboardSocket.disconnect();
                            }
                            
                            set((state) => ({
                                isLiveChatActive: false,
                                dashboardSocket: null,
                                isConnected: false,
                                agentName: null,
                                lastChatState: 'bot',
                                chatEnded: true,
                                messages: [...state.messages, {
                                    id: 'system-' + Date.now(),
                                    role: 'system',
                                    content: 'The chat session has ended.',
                                    timestamp: new Date().toISOString(),
                                }]
                            }));
                        }
                    } else {
                        // End bot chat session
                        // Access the current state directly from the store
                        const currentState = useChatStore.getState();
                        const { socket, sessionId } = currentState;
                        
                        // If socket exists, send the session_end command directly
                        if (socket && sessionId) {
                            try {
                                // If we have socket actions for ending bot chat, use them
                                if (socketActions && socketActions.endBotChat) {
                                    console.log('Ending bot chat session via passed socket actions');
                                    await socketActions.endBotChat();
                                } else {
                                    // Fallback to direct socket communication
                                    console.log('Ending bot chat session directly via socket');
                                    await socket.emit('user_uttered', {
                                        message: "/session_end",
                                        session_id: sessionId
                                    });
                                }
                                
                                console.log('Bot chat session ended and reset');
                            } catch (error) {
                                console.error('Failed to end bot conversation:', error);
                            }
                        }
                        
                        // Show the feedback form regardless of whether we could end the session via socket
                        set((state) => ({
                            chatEnded: true,
                            showFeedback: true,
                        }));
                    }
                } catch (error) {
                    console.error('Error ending chat session:', error);
                    // Add error message to chat
                    set((state) => ({
                        messages: [...state.messages, {
                            id: 'error-' + Date.now(),
                            role: 'system',
                            content: 'There was an error ending the chat session. Please try again.',
                            timestamp: new Date().toISOString(),
                        }]
                    }));
                }
            },

            // Derived action to handle complete handoff
            initiateHandoff: () => set((state) => {
                console.log('Initiating handoff process'); // Debug log
                return {
                    isLiveChatActive: true,
                    isLoading: false,
                    lastChatState: 'live_agent'
                };
            }),

            startNewChat: () => set((state) => {
                return {
                    messages: [],
                    isLiveChatActive: false,
                    agentName: null,
                    isLoading: false,
                    isTyping: false,
                    lastChatState: 'bot',
                    chatEnded: false,
                    menuOpen: false,
                    feedbackRating: null,
                    feedbackComment: "",
                    feedbackSatisfied: null,
                    chatActive: false, // Will be set to true after a short delay in the component
                    connectionErrorShown: false, // Reset connection error shown flag
                    dashboardConnectionErrorShown: false, // Reset dashboard connection error shown flag
                };
            }),

            endExistingLiveChat: () => set((state) => {
                if (state.dashboardSocket) {
                    state.dashboardSocket.disconnect();
                }
                return {
                    isLiveChatActive: false,
                    dashboardSocket: null,
                    isConnected: false,
                    agentName: null,
                    lastChatState: 'bot',
                    chatEnded: true,
                    showFeedback: true, // Show feedback form when agent ends the conversation
                    messages: [...state.messages, {
                        id: 'system-' + Date.now(),
                        role: 'system',
                        content: 'The chat session has ended. We would appreciate your feedback on this conversation.',
                        timestamp: new Date().toISOString(),
                    }]
                };
            }),
        }),
        {
            name: 'chat-storage', // name of the item in localStorage
            partialize: (state) => ({
                messages: state.messages,
                sessionId: state.sessionId,
                isLiveChatActive: state.isLiveChatActive,
                agentName: state.agentName,
                lastChatState: state.lastChatState,
                chatEnded: state.chatEnded,
                // Add migrated states that should be persisted
                isOpen: state.isOpen,
                widgetPosition: state.widgetPosition,
                activeTab: state.activeTab,
                unreadCount: state.unreadCount,
                connectionErrorShown: state.connectionErrorShown, // Persist connection error shown flag
                dashboardConnectionErrorShown: state.dashboardConnectionErrorShown, // Persist dashboard connection error shown flag
            }),
        }
    )
);

export default useChatStore;