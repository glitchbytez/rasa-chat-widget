# Rasa Chat Widget

A modern, feature-rich chat widget component for React applications with support for Rasa bot and live agent interactions.

## Features

- 🤖 **Bot Integration** - Connect to Rasa or any Socket.IO based chatbot
- 👨‍💼 **Live Agent Support** - Seamless handoff to human agents
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Customizable** - Fully customizable appearance and positioning
- 💾 **Persistent State** - Remembers chat history and settings
- 🔄 **Real-time** - WebSocket-based real-time messaging
- 📊 **Feedback System** - Built-in user feedback collection
- 🌐 **Network Resilient** - Handles network disconnections gracefully

## Installation

```bash
npm install @glitchbytez/rasa-chat-widget
```

## Quick Start

```jsx
import React from 'react';
import { ChatWidgetProvider } from '@glitchbytez/rasa-chat-widget';

function App() {
  return (
    <div>
      <h1>My App</h1>
      {/* Chat widget will appear as a floating button */}
      <ChatWidgetProvider />
    </div>
  );
}

export default App;
```

## Configuration

### Basic Configuration

```jsx
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
    <ChatWidgetProvider
      socketConfig={socketConfig}
      feedbackEndpoint="https://api.yoursite.com/feedback"
      initialPosition="bottom-right"
    />
  );
}
```

### Advanced Configuration

```jsx
import { ChatWidgetProvider, SocketProvider } from '@glitchbytez/rasa-chat-widget';

function App() {
  return (
    <SocketProvider config={{
      rasaServerUrl: "https://your-rasa-server.com",
      dashboardServerUrl: "https://your-dashboard-server.com"
    }}>
      <ChatWidgetProvider
        useExistingSocketContext={true}
        feedbackEndpoint="https://api.yoursite.com/feedback"
        initialPosition="bottom-left"
      />
    </SocketProvider>
  );
}
```

## Props

### ChatWidgetProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `socketConfig` | `object` | `{}` | Socket connection configuration |
| `useExistingSocketContext` | `boolean` | `false` | Use existing SocketProvider from parent |
| `feedbackEndpoint` | `string` | `'http://localhost:5500/api/v1/feedback/public'` | API endpoint for feedback submission |
| `initialPosition` | `string` | `'bottom-right'` | Initial widget position (`'bottom-right'`, `'bottom-center'`, `'bottom-left'`) |

### Socket Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rasaServerUrl` | `string` | `'http://localhost:5005'` | Rasa server URL |
| `socketPath` | `string` | `'/socket.io'` | Socket.IO path |
| `botMessageEvent` | `string` | `'bot_uttered'` | Bot message event name |
| `userMessageEvent` | `string` | `'user_uttered'` | User message event name |
| `dashboardServerUrl` | `string` | `'http://localhost:5501'` | Dashboard server URL for live agents |

## Usage Examples

### Custom Styling

The widget uses CSS classes that you can override:

```css
/* Override widget button color */
.chat-widget-button {
  background-color: #your-brand-color;
}

/* Customize message bubbles */
.chat-widget-message.user .chat-widget-message-bubble {
  background-color: #your-brand-color;
}
```

### Using Individual Components

```jsx
import { 
  ChatWidget, 
  SocketProvider, 
  useChatStore, 
  useSocket 
} from '@glitchbytez/rasa-chat-widget';

function MyCustomChatApp() {
  const { messages, isOpen, toggleWidget } = useChatStore();
  const { sendMessage } = useSocket();

  return (
    <SocketProvider>
      <button onClick={toggleWidget}>
        Toggle Chat {isOpen ? '(Open)' : '(Closed)'}
      </button>
      <ChatWidget />
    </SocketProvider>
  );
}
```

### Server Integration

#### Rasa Server Events

Your Rasa server should emit the following events:

```python
# In your Rasa action or custom channel
await sio.emit("bot_uttered", {
    "text": "Hello! How can I help you?",
    "session_id": session_id
})
```

#### Dashboard Server Events

For live agent functionality:

```javascript
// Agent message
socket.emit('agent_message', {
  message: 'Hello, I am here to help you',
  agentName: 'John Doe',
  sessionId: sessionId
});

// Typing indicator
socket.emit('agent_typing', {
  typing: true,
  sessionId: sessionId
});
```

## API Reference

### Hooks

#### `useChatStore()`

Access the chat store state and actions:

```jsx
const {
  // State
  messages,
  isOpen,
  isLoading,
  isLiveChatActive,
  agentName,
  
  // Actions
  toggleWidget,
  addMessage,
  clearMessages,
  setInput
} = useChatStore();
```

#### `useSocket()`

Access socket functionality:

```jsx
const {
  socket,
  dashboardSocket,
  sessionId,
  sendMessage,
  requestLiveAgent,
  endLiveChat
} = useSocket();
```

#### `useSendMessage()`

Send messages to bot or live agent:

```jsx
const { sendMessage, sendMessageToDashboard } = useSendMessage();

// Send to bot
sendMessage("Hello bot!");

// Send to live agent
sendMessageToDashboard("Hello agent!");
```

### Store Actions

```jsx
const store = useChatStore();

// Widget controls
store.toggleWidget();
store.setIsOpen(true);
store.toggleFullscreen();
store.togglePosition();

// Message management
store.addMessage({
  id: 'unique-id',
  role: 'user', // 'user', 'assistant', 'system'
  content: 'Hello!',
  timestamp: new Date().toISOString()
});

// Feedback
store.setShowFeedback(true);
store.submitFeedback();
```

## TypeScript Support

The package includes TypeScript definitions. For better type safety:

```typescript
import { ChatWidgetProvider, SocketConfig } from '@glitchbytez/rasa-chat-widget';

interface MyAppProps {
  chatConfig: SocketConfig;
}

const MyApp: React.FC<MyAppProps> = ({ chatConfig }) => {
  return (
    <ChatWidgetProvider
      socketConfig={chatConfig}
      initialPosition="bottom-right"
    />
  );
};
```

## Customization

### CSS Variables

Override CSS custom properties for easy theming:

```css
:root {
  --chat-widget-primary-color: #3b82f6;
  --chat-widget-secondary-color: #64748b;
  --chat-widget-background-color: #ffffff;
  --chat-widget-border-radius: 0.5rem;
}
```

### Custom Positioning

```jsx
<ChatWidgetProvider
  initialPosition="bottom-center"
  // Widget will appear at bottom center
/>
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, create an issue on GitHub at https://github.com/glitchbytez/rasa-chat-widget/issues

## Changelog

### 1.0.0
- Initial release
- Bot integration support
- Live agent handoff
- Responsive design
- Feedback system
