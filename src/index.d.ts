import { ReactNode } from 'react';

export interface SocketConfig {
  rasaServerUrl?: string;
  socketPath?: string;
  botMessageEvent?: string;
  userMessageEvent?: string;
  dashboardServerUrl?: string;
}

export interface ChatWidgetProviderProps {
  socketConfig?: SocketConfig;
  useExistingSocketContext?: boolean;
  feedbackEndpoint?: string;
  initialPosition?: 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type?: 'text' | 'buttons' | 'image' | 'custom';
  content?: string;
  payload?: any;
  timestamp: string;
}

export interface SendMessageHook {
  sendMessage: (text: string) => void;
  sendMessageToDashboard: (text: string) => void;
}

export interface SocketContextValue {
  connectToDashboard: (agentName: string) => void;
  disconnectFromDashboard: () => void;
  startChat: () => void;
  endLiveChat: () => Promise<void>;
  endBotChat: () => Promise<void>;
  isLiveChatActive: boolean;
  sendMessage: (message: string) => Promise<boolean>;
  handleUnexpectedError: (error: Error, context?: any) => void;
  isOnline: boolean;
}

declare const ChatWidget: React.ComponentType;
declare const ChatWidgetProvider: React.ComponentType<ChatWidgetProviderProps>;
declare const SocketContext: React.Context<SocketContextValue | null>;
declare const useSendMessage: () => SendMessageHook;
declare const chatStore: any;

export {
  ChatWidget,
  ChatWidgetProvider,
  SocketContext,
  useSendMessage,
  chatStore
};

export * from './components/ChatWidget.jsx';
export * from './components/ChatWidgetProvider.jsx';
export * from './context/SocketContext.js';
export * from './hooks/useSendMessage.js';
export * from './stores/chatStore.js'; 