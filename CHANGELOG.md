# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-01-XX

### 🎨 Fixed
- **Major Styling Issue**: Fixed critical styling problem where component used Tailwind utility classes but package contained incompatible custom CSS
- Component now properly displays with all intended styles (backgrounds, borders, colors, spacing, etc.)

### 🔧 Changed
- Replaced custom CSS classes with compiled Tailwind CSS
- Updated build process to properly compile Tailwind utilities
- Added PostCSS configuration for Tailwind processing
- Updated Rollup configuration for better CSS handling

### ✨ Added
- Tailwind CSS v3.4.0 integration
- Custom scrollbar styling for chat messages
- Typing indicator animations
- Responsive design utilities
- CSS import requirements in documentation

### 📚 Documentation
- Updated USAGE.md with critical CSS import instructions
- Added styling section with customization guidelines
- Clarified component requirements and dependencies

### 🛠️ Technical
- Added `tailwindcss` and `autoprefixer` as dev dependencies
- Created `tailwind.config.js` and `postcss.config.js` 
- Updated build pipeline to generate proper CSS output

## [1.0.0] - 2024-01-XX

### ✨ Initial Release
- React chat widget component with Rasa integration
- Socket.IO real-time messaging
- Chat state management with Zustand
- Feedback system integration
- TypeScript support
- Multiple positioning options 