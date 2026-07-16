# Components

Reusable UI components for the FFDS application.

## Component Categories

### Layout Components
- **Layout.jsx** - Main application layout with navigation
- **AuthLayout.jsx** - Layout for authentication pages
- **PageWrapper.jsx** - Wrapper for page components

### Dashboard Components
- **AdminDashboard.jsx** - Admin dashboard main component
- **ConsumerDashboard.jsx** - Consumer dashboard main component
- **ManagerDashboard.jsx** - Manager dashboard main component

### Feature Components
- **ChatBot.jsx** - AI chatbot interface
- **ExpiryAlert.jsx** - Expiry date alert component
- **ExpiryBanner.jsx** - Banner for expiry notifications
- **InventoryList.jsx** - Inventory list display
- **NotificationBell.jsx** - Notification bell with badge
- **ScanResult.jsx** - Food scan result display
- **SplashScreen.jsx** - Application splash screen

### Landing Page Components
See `landing/` directory for landing page specific components.

## Component Guidelines

### Creating New Components
1. Use functional components with hooks
2. Follow PascalCase naming convention
3. Add PropTypes or TypeScript interfaces
4. Include JSDoc comments for complex components
5. Keep components focused and reusable

### Styling
- Use Tailwind CSS classes
- Keep styles consistent with design system
- Ensure responsive design
- Test on multiple screen sizes

### Props
- Destructure props at component top
- Provide default values when appropriate
- Use PropTypes for runtime validation
- Document complex prop objects

## Example Component Structure

```jsx
import React from 'react';

/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.title - Component title
 */
const ComponentName = ({ title }) => {
  return (
    <div className="component-class">
      {title}
    </div>
  );
};

export default ComponentName;
```
