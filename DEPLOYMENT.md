# Deployment Checklist

## Pre-Deployment Steps

### 1. Update Package Information
- [ ] Update `package.json` name field to your actual organization/package name
- [ ] Update `author` field with your name
- [ ] Update `repository`, `homepage`, and `bugs` URLs
- [ ] Verify version number (currently 1.0.0)

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

**Available Exports:**
- `ChatWidget` - Main chat widget component
- `ChatWidgetProvider` - Complete provider wrapper (recommended)
- `SocketProvider` - Socket context provider
- `useSocket` - Socket context hook
- `useSendMessage` - Message sending hook
- `chatStore` - Zustand store for chat state 