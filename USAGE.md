# React Chat Widget Usage Guide

## Installation

```bash
npm install @glitchbytez/rasa-chat-widget
```

## Basic Usage

### Option 1: Using ChatWidgetProvider (Recommended)

The `ChatWidgetProvider` is a complete, standalone component that includes all necessary context providers.

```jsx
import React from 'react';
import { ChatWidgetProvider } from '@glitchbytez/rasa-chat-widget';

function App() {
  const socketConfig = {
    rasaServerUrl: "http://localhost:5005",
    socketPath: "/socket.io",
    botMessageEvent: "bot_uttered",
    userMessageEvent: "user_uttered",
    dashboardServerUrl: "http://localhost:5501"
  };

  return (
    <div className="App">
      {/* Your app content */}
      <h1>My Application</h1>
      
      {/* Chat Widget - Styling is automatically included! */}
      <ChatWidgetProvider
        socketConfig={socketConfig}
        feedbackEndpoint="http://localhost:5500/api/v1/feedback/public"
        initialPosition="bottom-right"
      />
    </div>
  );
}

export default App;
```

### Option 2: Using Individual Components

If you need more control or want to integrate with existing socket connections:

```jsx
import React from 'react';
import { SocketProvider, ChatWidget } from '@glitchbytez/rasa-chat-widget';

function App() {
  const socketConfig = {
    rasaServerUrl: "http://localhost:5005",
    socketPath: "/socket.io",
    botMessageEvent: "bot_uttered",  
    userMessageEvent: "user_uttered",
    dashboardServerUrl: "http://localhost:5501"
  };

  return (
    <div className="App">
      <h1>My Application</h1>
      
      <SocketProvider config={socketConfig}>
        <ChatWidget />
      </SocketProvider>
    </div>
  );
}

export default App;
```

## Configuration Options

### ChatWidgetProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `socketConfig` | `Object` | `{}` | Socket.IO configuration object |
| `useExistingSocketContext` | `boolean` | `false` | Use existing SocketProvider from parent |
| `feedbackEndpoint` | `string` | `'http://localhost:5500/api/v1/feedback/public'` | API endpoint for feedback submission |
| `initialPosition` | `string` | `'bottom-right'` | Widget position: `'bottom-right'`, `'bottom-center'`, or `'bottom-left'` |

### Socket Configuration

```jsx
const socketConfig = {
  rasaServerUrl: "http://localhost:5005",        // Rasa server URL
  socketPath: "/socket.io",                      // Socket.IO path
  botMessageEvent: "bot_uttered",                // Event name for bot messages
  userMessageEvent: "user_uttered",              // Event name for user messages  
  dashboardServerUrl: "http://localhost:5501"    // Dashboard server URL for live chat
};
```

## Advanced Usage

### Using with Existing Socket Context

If you already have a SocketProvider in your app:

```jsx
import { ChatWidgetProvider } from '@glitchbytez/rasa-chat-widget';

function MyComponent() {
  return (
    <ChatWidgetProvider 
      useExistingSocketContext={true}
      feedbackEndpoint="https://api.myapp.com/feedback"
    />
  );
}
```

### Custom Hooks

You can also use the individual hooks for custom implementations:

```jsx
import { useSendMessage, useSocket } from '@glitchbytez/rasa-chat-widget';

function CustomChatComponent() {
  const { sendMessage } = useSendMessage();
  const { isLiveChatActive, startChat } = useSocket();
  
  const handleSend = () => {
    sendMessage("Hello!");
  };
  
  return (
    <div>
      <button onClick={handleSend}>Send Message</button>
      <button onClick={startChat}>Start Chat</button>
      <p>Live chat active: {isLiveChatActive ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Styling

**Automatic CSS Injection:** The component automatically injects all required CSS when imported. No manual CSS imports are needed!

The CSS is bundled directly into the JavaScript and automatically injected into the page when you import the component. This includes:
- Complete Tailwind CSS utilities for the chat widget
- Custom scrollbar styling
- Typing indicator animations
- Responsive design classes

If you need to customize the appearance further, you can:
1. Override specific CSS classes in your own stylesheet
2. Use CSS-in-JS solutions to modify component styling
3. Create custom themes by overriding CSS custom properties

## Requirements

- React >= 16.8.0
- react-dom >= 16.8.0

## Dependencies

The package includes these dependencies:
- `lucide-react` - For icons
- `socket.io-client` - For real-time communication
- `uuid` - For generating unique IDs
- `zustand` - For state management 