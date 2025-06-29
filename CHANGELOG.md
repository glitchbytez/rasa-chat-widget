# Changelog

All notable changes to this project will be documented in this file.

## [1.2.2] - 2024-12-22

### 🐛 Fixed
- **Critical Text Truncation**: Fixed severe text truncation issue in chat bubbles where long content like email addresses were being cut off to just the last character(s)
- **Message Text Rendering**: Added comprehensive CSS styles to prevent text overflow and ensure proper text rendering
- **Cross-browser Compatibility**: Enhanced text display stability across different browsers and contexts
- **Font Loading Issues**: Added explicit text rendering properties to prevent font-related display problems

### 🎨 Styling Enhancements
- Added `message-text-content` and `chat-widget-message-text` CSS classes for better text control
- Implemented `!important` declarations to override any conflicting styles
- Enhanced text overflow handling with explicit `text-overflow: clip` and `overflow: visible`
- Improved white-space and word-break properties for better text wrapping

### 🔧 Technical Improvements
- Added backup CSS rules to prevent CSS conflicts from external stylesheets
- Enhanced message bubble text container with forced display properties
- Improved text rendering with explicit font-size, line-height, and color properties

## [1.2.1] - 2024-12-19

### 🐛 Fixed
- **Message Bubble Rendering**: Completely redesigned message bubble layout system
  - Fixed message bubbles not rendering properly
  - Resolved message overlapping and cut-off issues  
  - Fixed centering problems - bubbles now properly align left (bot) and right (user)
  - Improved responsive behavior on different screen sizes
  - Enhanced text wrapping and overflow handling

### 🎨 Layout Improvements
- Simplified flex container structure for better reliability
- Changed from complex nested flex to cleaner margin-based positioning
- Reduced max-width from 85% to 75% for better readability
- Added proper margin spacing (ml-8/mr-8) to prevent edge-to-edge bubbles

### ✨ Styling Enhancements
- Added custom CSS utilities for word breaking and text rendering
- Improved border radius for more consistent bubble appearance
- Enhanced spacing between message elements
- Better visual hierarchy with improved typography
- Smoother text rendering with antialiasing

## [1.2.0] - 2024-01-XX

### 🚀 Major Developer Experience Improvement
- **Automatic CSS Injection**: CSS is now automatically bundled and injected into the JavaScript
- **No Manual CSS Import Required**: Developers no longer need to manually import CSS files
- Component styling works immediately upon import with zero configuration

### 🔧 Technical Changes
- Updated Rollup configuration to inject CSS instead of extracting it
- CSS is now embedded directly into the JavaScript bundle
- Automatic DOM style injection when component is loaded
- Reduced friction for developers using the package

### 📚 Documentation
- Updated README.md to remove CSS import requirements
- Updated USAGE.md with simplified installation instructions
- Added automatic styling information to documentation

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