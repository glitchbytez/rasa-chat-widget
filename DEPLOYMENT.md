# Deployment Checklist

## Pre-Deployment Steps

### 1. Update Package Information ✅ COMPLETED
- [x] Updated `package.json` name field to `@glitchbytez/rasa-chat-widget`
- [x] Updated `author` field to "Glitchbytez"
- [x] Updated `repository`, `homepage`, and `bugs` URLs
- [x] Version number verified (currently 1.0.0)

### 2. Test the Package
- [ ] Run `npm run build` to ensure clean build
- [ ] Test imports: `node -e "console.log(Object.keys(require('./dist/index.js')))"`
- [ ] Verify all exports are available

## Publishing to NPM

### 1. NPM Account Setup
```bash
# Login to npm (if not already logged in)
npm login
```

### 2. Publish (First Time)
```bash
# Build the package
npm run build

# Publish to npm
npm publish --access public
```

### 3. Publish Updates
```bash
# Update version number
npm version patch  # or minor/major

# Build and publish
npm run build
npm publish
```

## Package Information

**Current Configuration:**
- Package Name: `@glitchbytez/rasa-chat-widget`
- Version: 1.0.0
- Main: `dist/index.js`
- Module: `dist/index.esm.js`
- Types: `dist/index.d.ts`

**Available Exports:**
- `ChatWidget` - Main chat widget component
- `ChatWidgetProvider` - Complete provider wrapper (recommended)
- `SocketProvider` - Socket context provider
- `useSocket` - Socket context hook
- `useSendMessage` - Message sending hook
- `chatStore` - Zustand store for chat state

## Post-Deployment

### 1. Verify Publication
- [ ] Check package on npmjs.com
- [ ] Test installation: `npm install @glitchbytez/rasa-chat-widget`
- [ ] Test usage in a new project

## Testing in Another Project

Create a test React app to verify the package works:

```bash
npx create-react-app test-chat-widget
cd test-chat-widget
npm install @glitchbytez/rasa-chat-widget
```

Then test the basic usage:

```jsx
// src/App.js
import { ChatWidgetProvider } from '@glitchbytez/rasa-chat-widget';

function App() {
  return (
    <div className="App">
      <h1>Test App</h1>
      <ChatWidgetProvider 
        socketConfig={{
          rasaServerUrl: "http://localhost:5005"
        }}
      />
    </div>
  );
}

export default App;
``` 