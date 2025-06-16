import React, { useRef, useEffect } from "react"
import {
    GraduationCap,
    MoreVertical,
    X,
    Send,
    Star,
    ThumbsUp,
    ThumbsDown,
    Home,
    MessageCircle,
    PlusCircle,
    ChevronRight,
    BookOpen,
    Calendar,
    HelpCircle,
    ExternalLink,
    Maximize2,
    Minimize2,
} from "lucide-react"
import useChatStore from '../stores/chatStore'
import {useSendMessage} from '../hooks/useSendMessage'
import {useSocket} from '../context/SocketContext'

export default function ChatWidget() {
    // Get all states and actions from the chatStore
    const { 
        // Original states
        messages, 
        isLoading, 
        addMessage, 
        clearMessages, 
        isTyping, 
        isLiveChatActive, 
        agentName, 
        lastChatState, 
        chatEnded, 
        setChatEnded,
        isConnectingToLiveAgent,
        
        // Migrated states
        isOpen,
        setIsOpen,
        widgetPosition,
        setWidgetPosition,
        isFullscreen,
        setIsFullscreen,
        activeTab,
        setActiveTab,
        input,
        setInput,
        chatActive,
        setChatActive,
        menuOpen,
        setMenuOpen,
        isMobile,
        setIsMobile,
        showConfirmation,
        setShowConfirmation,
        showFeedback,
        setShowFeedback,
        feedbackRating,
        setFeedbackRating,
        feedbackComment,
        setFeedbackComment,
        feedbackSatisfied,
        setFeedbackSatisfied,
        unreadCount,
        setUnreadCount,
        
        // Feedback submission states
        isFeedbackSubmitting,
        feedbackSubmissionStatus,
        
        // Migrated actions
        toggleWidget,
        toggleFullscreen,
        togglePosition,
        handleTabChange,
        updateUnreadCount,
        resetFeedbackState,
        submitFeedback,
        cancelFeedback,
        handleConfirmEndChat,
        startNewChat
    } = useChatStore();
    
    const { sendMessage, sendMessageToDashboard } = useSendMessage();
    const {endLiveChat, endBotChat, startChat} = useSocket();

    const messagesEndRef = useRef(null);
    const menuRef = useRef(null);
    const inputRef = useRef(null);
    const confirmationRef = useRef(null);
    const feedbackRef = useRef(null);
    const widgetRef = useRef(null);

    // Check if messages exist on page load and switch to chat tab
    useEffect(() => {
        if (messages.length > 0) {
            handleTabChange("chat");
            toggleWidget();
        }
    }, []);

    // Check if device is mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 640);
        }

        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);

        return () => {
            window.removeEventListener("resize", checkIfMobile);
        }
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }

            // Close confirmation dialog when clicking outside
            if (confirmationRef.current && !confirmationRef.current.contains(event.target) && showConfirmation) {
                setShowConfirmation(false);
            }

            // Don't close the widget when clicking inside it
            if (
                widgetRef.current &&
                !widgetRef.current.contains(event.target) &&
                isOpen &&
                !showConfirmation &&
                !showFeedback
            ) {
                // Uncomment this to make the widget close when clicking outside
                // setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [menuRef, showConfirmation, isOpen, showFeedback]);


    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, showFeedback]);

    // Add a separate effect to scroll when typing indicator appears
    useEffect(() => {
        if (isLoading || isTyping) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isLoading, isTyping]);

    // Focus input when bot finishes responding
    useEffect(() => {
        // When isLoading changes from true to false, focus the input
        if (
            !isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "assistant" &&
            activeTab === "chat" &&
            !chatEnded &&
            isOpen
        ) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isLoading, messages, activeTab, chatEnded, isOpen]);

    // Update unread count when messages change and widget is closed
    useEffect(() => {
        updateUnreadCount();
    }, [messages, isOpen]);

    // Format time as HH:MM AM/PM
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            return new Date(timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            console.error('Error formatting time:', error);
            return '';
        }
    }
    
    // Calculate time ago from timestamp
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        
        try {
            // Parse the timestamp to a Date object if it's a string
            let messageDate;
            if (typeof timestamp === 'string') {
                messageDate = new Date(timestamp);
            } else if (timestamp instanceof Date) {
                messageDate = timestamp;
            } else {
                // If timestamp is neither string nor Date, return default
                return 'Just now';
            }
            
            // Validate that we have a valid date
            if (!(messageDate instanceof Date) || isNaN(messageDate.getTime())) {
                return 'Just now';
            }
            
            const now = new Date();
            const diffMs = now.getTime() - messageDate.getTime();
            
            // Handle future dates or small time differences
            if (diffMs < 0 || diffMs < 60000) return 'Just now';
            
            // Calculate minutes ago
            const minutes = Math.floor(diffMs / 60000);
            if (isNaN(minutes) || minutes < 0) {
                return 'Just now';
            }
            
            return `${minutes}m ago`;
        } catch (error) {
            console.error('Error calculating time ago:', error);
            return 'Just now';
        }
    }

    // Show confirmation dialog
    const handleEndChatClick = () => {
        // Check if there are any user messages before allowing to end chat
        const hasUserMessages = messages.some(msg => msg.role === 'user');
        if (!hasUserMessages) {
            return; // Don't allow ending chat if no user messages
        }
        
        // Immediately stop typing indicator when user initiates chat end
        setMenuOpen(false)
        setShowConfirmation(true)
        // Force stop typing animation immediately
        useChatStore.setState({
            isTyping: false,
            isLoading: false
        })
    }

    // Handle input change on the chat box
    const handleInputChange = (e) => {
        setInput(e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Get fresh state to avoid stale closures
        const { isLiveChatActive, dashboardSocket } = useChatStore.getState();

        console.log('Message submission state:', {
            isLiveChatActive,
            dashboardConnected: dashboardSocket?.connected,
            input
        });

        if (isLiveChatActive && dashboardSocket?.connected) {
            console.log('Sending to live agent:', input);
            sendMessageToDashboard(input);
        } else {
            // If supposed to be in live chat but connection failed
            console.log('Sending to bot:', input);
            sendMessage(input);
        }

        setInput('');
    };

    return (
        <div
            className="fixed z-50 bottom-8 right-4 flex flex-col items-end"
            ref={widgetRef}
        >
            {/* Expanded Widget */}
            {isOpen && (
                <div
                    className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out mb-3
            ${isFullscreen ? "fixed inset-4 w-auto h-auto" : "w-[350px] sm:w-[380px] h-[600px]"}
            ${isFullscreen ? "z-50" : "z-40"}
            ${!isFullscreen && widgetPosition === "bottom-center" ? "fixed bottom-8 left-1/2 transform -translate-x-1/2" : ""}
            ${!isFullscreen && widgetPosition === "bottom-left" ? "fixed bottom-8 left-4" : ""}
          `}
                    style={{
                        transform: isOpen ? "scale(1)" : "scale(0.95)",
                        opacity: isOpen ? 1 : 0,
                        transformOrigin: widgetPosition === "bottom-right" ? "bottom right" : 
                                        widgetPosition === "bottom-center" ? "bottom center" : "bottom left",
                        marginBottom: widgetPosition !== "bottom-right" ? "60px" : "12px"
                    }}
                >
                    {/* Widget Header */}
                    <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isLiveChatActive ? (
                                <>
                                    <div className="flex-shrink-0 h-6 w-6 bg-blue-700 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                            {agentName?.charAt(0) || 'A'}
                                        </span>
                                    </div>
                                    <span className="font-medium">{agentName || 'Agent'}</span>
                                </>
                            ) : (
                                <>
                                    <GraduationCap className="h-5 w-5" />
                                    <span className="font-medium whitespace-nowrap">Campus Assistant</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleFullscreen}
                                className="p-1.5 hover:bg-blue-700 rounded-full transition-colors"
                                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={toggleWidget}
                                className="p-1.5 hover:bg-blue-700 rounded-full transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Widget Content */}
                    <div className="flex flex-col h-[calc(100%-56px)]">
                        {/* Home Tab Content */}
                        {activeTab === "home" && (
                            <div className="flex-1 overflow-y-auto">
                                <div className="bg-gradient-to-b from-blue-500 to-blue-300 p-6 pb-12">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                            <GraduationCap className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex -space-x-2">
                                            {["A", "B", "C"].map((letter, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white ${
                                                        i === 0 ? "bg-blue-700" : i === 1 ? "bg-yellow-500" : "bg-red-500"
                                                    }`}
                                                >
                                                    {letter}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <h1 className="text-2xl font-bold text-white mb-1">Hi Student 👋</h1>
                                    <p className="text-lg text-white/90 font-medium">How can we help?</p>
                                </div>

                                <div className="px-4 -mt-6">
                                    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                                        <h2 className="text-sm font-medium text-gray-700 mb-2">Recent conversation</h2>
                                        {messages.length > 1 ? (
                                            <div
                                                className="flex items-start gap-3 border-l-2 border-blue-500 pl-3 py-1 cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                                                onClick={() => handleTabChange("chat")}
                                            >
                                                <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <GraduationCap className="h-3 w-3 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-800 line-clamp-2">{messages[messages.length - 1].content}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        {formatTime([messages[messages.length - 1].timestamp])}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">No recent conversations</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleTabChange("chat")}
                                        className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MessageCircle className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-800">Chat with us</p>
                                                <p className="text-xs text-gray-500">We typically reply in under 5 minutes</p>
                                            </div>
                                        </div>
                                        <div className="text-blue-600">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Chat Tab Content */}
                        {activeTab === "chat" && (
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar bg-white">
                                {messages.map((msg) => {
                                    const timestamp = msg.timestamp;
                                    const isUser = msg.role === 'user';
                                    const isSystem = msg.role === 'system';

                                    if (isSystem) {
                                        return (
                                            <div key={msg.id} className="flex justify-center my-2">
                                                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}>
                                            {/* We're removing the sender name from outside the bubble */}

                                            {/* Message content */}
                                            <div className="flex">
                                                <div
                                                    className={`p-3 max-w-[85%] ${isUser ? 'bg-blue-600 text-white rounded-t-2xl rounded-bl-2xl' : 'bg-gray-100 text-gray-800 rounded-t-2xl rounded-br-2xl'}`}
                                                    style={{ minWidth: !isUser ? '200px' : 'auto' }}
                                                >
                                                    {/* Text Messages */}
                                                    {msg.type === 'text' && (
                                                        <>
                                                            {!isUser && (
                                                                <div className="flex flex-wrap items-center mb-1">
                                                                    <span className="text-sm font-medium text-blue-600 whitespace-nowrap mr-2">
                                                                        {msg.role === 'system' ? 'Campus Assistant' : (isLiveChatActive ? agentName || 'Agent' : 'Campus Assistant')}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                        {getTimeAgo(timestamp)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <p className="text-sm">{msg.content}</p>
                                                        </>
                                                    )}

                                                    {/* Image Messages */}
                                                    {msg.type === 'image' && (
                                                        <img
                                                            src={msg.content}
                                                            alt="Bot response"
                                                            className="rounded-lg max-w-[200px]"
                                                        />
                                                    )}

                                                    {/* Buttons */}
                                                    {msg.type === 'buttons' && msg.payload && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {msg.payload.map((button, idx) => (
                                                                <button
                                                                    key={`btn-${idx}-${button.title}`}
                                                                    onClick={() => sendMessage(button.payload)}
                                                                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                                                >
                                                                    {button.title}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Custom Payload */}
                                                    {msg.type === 'custom' && (
                                                        <pre className="bg-gray-200 text-gray-700 p-2 rounded-md text-xs mt-2 overflow-x-auto">
                                                            {JSON.stringify(msg.payload, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Loading Typing Indicator || isTyping - Only show when chat is active */}
                                {(isLoading || isTyping) && !chatEnded && !showFeedback && !showConfirmation && (
                                    <div className="flex flex-col items-start mb-4">
                                        {/* Removed agent name header for typing indicator */}
                                        <div className="flex">
                                            <div className="bg-gray-100 text-gray-800 rounded-t-2xl rounded-br-2xl p-3 max-w-[85%]" style={{ minWidth: '200px' }}>
                                                <div className="flex flex-wrap items-center mb-1">
                                                    <span className="text-sm font-medium text-blue-600 whitespace-nowrap mr-2">
                                                        {isLiveChatActive ? agentName || 'Romeo' : 'Campus Assistant'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        • Just now
                                                    </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <div className="h-2 w-2 bg-gray-400 rounded-full typing-dot animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="h-2 w-2 bg-gray-400 rounded-full typing-dot animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="h-2 w-2 bg-gray-400 rounded-full typing-dot animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}

                        {/* Feedback Form */}
                        {showFeedback && (
                            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3">
                                <h3 className="text-sm font-medium">Chat Feedback</h3>
                                <p className="text-xs text-gray-600">Please rate your experience with our chat support.</p>
                                
                                {/* Feedback Submission Status */}
                                {feedbackSubmissionStatus === 'success' && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-xs flex items-center">
                                        <div className="mr-2 flex-shrink-0 h-4 w-4 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-500 text-xs">✓</span>
                                        </div>
                                        Thank you for your feedback! Your responses help us improve.
                                    </div>
                                )}
                                
                                {feedbackSubmissionStatus === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs flex items-center">
                                        <div className="mr-2 flex-shrink-0 h-4 w-4 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-red-500 text-xs">!</span>
                                        </div>
                                        There was an error submitting your feedback. Please try again.
                                    </div>
                                )}

                                {/* Star Rating */}
                                <div>
                                    <p className="text-xs font-medium text-gray-700 mb-1.5">How would you rate this conversation?</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                onClick={() => setFeedbackRating(rating)}
                                                className={`p-1.5 rounded-full ${
                                                    feedbackRating === rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                                                }`}
                                                disabled={isFeedbackSubmitting}
                                            >
                                                <Star className="h-4 w-4" fill={feedbackRating && rating <= feedbackRating ? 'currentColor' : 'none'} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Satisfaction */}
                                <div>
                                    <p className="text-xs font-medium text-gray-700 mb-1.5">Did we resolve your issue?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFeedbackSatisfied(true)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs ${
                                                feedbackSatisfied === true
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            disabled={isFeedbackSubmitting}
                                        >
                                            <ThumbsUp className="h-3 w-3" />
                                            <span>Yes</span>
                                        </button>
                                        <button
                                            onClick={() => setFeedbackSatisfied(false)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs ${
                                                feedbackSatisfied === false
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            disabled={isFeedbackSubmitting}
                                        >
                                            <ThumbsDown className="h-3 w-3" />
                                            <span>No</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Comments */}
                                <div>
                                    <label htmlFor="feedback-comment" className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Additional comments (optional)
                                    </label>
                                    <textarea
                                        id="feedback-comment"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent text-xs"
                                        rows={3}
                                        placeholder="Tell us more about your experience..."
                                        disabled={isFeedbackSubmitting}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={cancelFeedback}
                                        className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isFeedbackSubmitting}
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={submitFeedback}
                                        className={`px-3 py-1.5 text-xs ${isFeedbackSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        disabled={isFeedbackSubmitting || feedbackSubmissionStatus === 'success'}
                                    >
                                        {isFeedbackSubmitting ? (
                                            <>
                                                <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <span>Submit Feedback</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Widget Footer */}
                        <div className="border-t border-gray-200 bg-white">
                            {activeTab === "chat" && (
                                <form onSubmit={handleSubmit} className="p-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={handleInputChange}
                                            placeholder={chatEnded ? "Chat ended. Start a new chat from the menu." : isConnectingToLiveAgent ? "Connecting to live agent..." : "Type your message..."}
                                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent text-xs"
                                            disabled={isLoading || showConfirmation || showFeedback || chatEnded || isConnectingToLiveAgent}
                                            autoFocus={activeTab === "chat" && !chatEnded && !isConnectingToLiveAgent}
                                        />
                                        <button
                                            type="submit"
                                            className="text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:hover:text-blue-500 p-2"
                                            disabled={isLoading || !input.trim() || showConfirmation || showFeedback || chatEnded || isConnectingToLiveAgent}
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="relative" ref={menuRef}>
                                            <button
                                                onClick={() => setMenuOpen(!menuOpen)}
                                                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-md hover:bg-gray-100"
                                                aria-label="Menu"
                                            >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </button>

                                            {menuOpen && (
                                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                                    <div className="py-1">
                                                        {chatEnded ? (
                                                            <button
                                                                onClick={() => {
                                                                    startNewChat();
                                                                    startChat();
                                                                    // Visual feedback that chat was reset
                                                                    setChatActive(false);
                                                                    setTimeout(() => setChatActive(true), 300);
                                                                    // Focus the input after resetting
                                                                    setTimeout(() => {
                                                                        if (activeTab === "chat") {
                                                                            inputRef.current?.focus();
                                                                        }
                                                                    }, 400);
                                                                }}
                                                                className="w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                            >
                                                                <PlusCircle className="h-3.5 w-3.5" />
                                                                New Chat
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={handleEndChatClick}
                                                                    className={`w-full text-left px-4 py-3 text-xs flex items-center gap-2 ${messages.filter(msg => msg.role === 'user').length === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                                                    disabled={messages.filter(msg => msg.role === 'user').length === 0}
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                    End Chat
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* Tab Navigation */}
                            <div className="flex border-t border-gray-200">
                                <button
                                    onClick={() => handleTabChange("home")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 ${
                                        activeTab === "home" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500"
                                    }`}
                                >
                                    <Home className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">Home</span>
                                </button>
                                <button
                                    onClick={() => handleTabChange("chat")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 ${
                                        activeTab === "chat" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500"
                                    }`}
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">Chat</span>
                                </button>
                            </div>
                        </div>

                        {/* Confirmation Dialog */}
                        {showConfirmation && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white bg-opacity-80">
                                <div
                                    ref={confirmationRef}
                                    className="bg-white rounded-lg p-4 max-w-sm w-full shadow-lg border border-gray-200"
                                >
                                    <h3 className="text-sm font-medium mb-2">End Chat?</h3>
                                    <p className="text-xs text-gray-600 mb-4">Are you sure you want to end this chat session?</p>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowConfirmation(false)}
                                            className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-md"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Pass the socket actions to handleConfirmEndChat
                                                // instead of calling them separately
                                                handleConfirmEndChat({
                                                    endLiveChat,
                                                    endBotChat
                                                });
                                            }}
                                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            End Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat Button (Collapsed Widget) */}
            <button
                onClick={toggleWidget}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 ease-in-out
                  ${isOpen ? "scale-0 opacity-0 h-0 w-0" : "scale-100 opacity-100"}
                  ${unreadCount > 0 ? "bg-blue-600" : "bg-blue-500 hover:bg-blue-600"}
                `}
                aria-label="Open chat"
            >
                <span className="text-white font-medium text-sm whitespace-nowrap">Get help</span>
                {unreadCount > 0 ? (
                    <div className="relative">
                        <HelpCircle className="h-5 w-5 text-white" />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                    </div>
                ) : (
                    <HelpCircle className="h-5 w-5 text-white" />
                )}
            </button>
        </div>
    )
}
