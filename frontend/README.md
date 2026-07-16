# Frontend - FFDS Application

React-based frontend application for the Food Freshness Detection System.

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **Language**: JavaScript (JSX)

## Directory Structure

```
frontend/
├── public/              # Static assets (icons, favicon)
├── src/
│   ├── api/             # API service layers and HTTP clients
│   ├── components/      # Reusable UI components
│   │   └── landing/     # Landing page specific components
│   ├── context/         # React context providers (auth, theme, etc.)
│   ├── i18n/            # Internationalization language files
│   ├── pages/           # Page components by role
│   │   ├── admin/       # Admin dashboard pages
│   │   ├── consumer/    # Consumer-facing pages
│   │   ├── farmer/      # Farmer dashboard pages
│   │   └── manager/     # Manager dashboard pages
│   ├── App.jsx          # Main application component
│   ├── AppRoutes.jsx    # Route configuration
│   ├── index.css        # Global styles and Tailwind imports
│   └── main.jsx         # Application entry point
├── .env.example         # Environment variables template
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.js       # Vite build configuration
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features

### Role-Based Dashboards
- **Admin**: User management, system configuration, analytics
- **Consumer**: Food scanning, expiry tracking, personal inventory
- **Farmer**: Crop management, supply chain tracking, distribution
- **Manager**: Inventory oversight, staff coordination, reporting

### Core Components
- **Authentication**: Login/Register pages with JWT handling
- **Scanning**: Camera integration for food classification
- **Inventory**: List management with expiry alerts
- **Notifications**: Real-time alerts and notifications
- **ChatBot**: AI-powered assistance

## Environment Variables

```env
VITE_API_URL=your_core_api_url
VITE_CNN_SERVICE_URL=your_cnn_service_url
```

## Development Notes

- All API calls should go through services in `src/api/`
- Use Tailwind CSS for styling (custom styles in `index.css`)
- Follow existing component patterns and naming conventions
- Test responsive design at multiple breakpoints
- Use React Context for global state management

## Related Documentation
- [Frontend Workflow](../../.windsurf/workflows/frontend-workflow.md)
- [Deployment Workflow](../../.windsurf/workflows/deployment-workflow.md)
