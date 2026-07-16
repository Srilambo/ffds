---
description: Frontend development workflow for FFDS application
---

# Frontend Development Workflow

## Project Structure
```
frontend/
├── public/              # Static assets (icons, favicon)
├── src/
│   ├── api/             # API service layers
│   ├── components/      # Reusable UI components
│   │   └── landing/     # Landing page specific components
│   ├── context/         # React context providers
│   ├── i18n/            # Internationalization files
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin-specific pages
│   │   ├── consumer/    # Consumer-specific pages
│   │   ├── farmer/      # Farmer-specific pages
│   │   └── manager/     # Manager-specific pages
│   ├── App.jsx          # Main app component
│   ├── AppRoutes.jsx    # Route configuration
│   ├── index.css        # Global styles
│   └── main.jsx         # Application entry point
├── .env.example         # Environment variables template
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.js       # Vite build configuration
```

## Development Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Component Development Guidelines

### Creating New Components
1. Place reusable components in `src/components/`
2. Place page-specific components in respective `src/pages/` subdirectories
3. Use functional components with hooks
4. Follow existing naming conventions (PascalCase)

### API Integration
1. API calls should be made through services in `src/api/`
2. Use async/await for asynchronous operations
3. Implement proper error handling
4. Use environment variables for API endpoints

### Styling
1. Use Tailwind CSS for styling
2. Custom styles go in `src/index.css` or component-specific CSS modules
3. Follow responsive design principles
4. Maintain consistency with existing UI

## Key Features by Role

### Admin Dashboard
- User management
- System configuration
- Analytics overview

### Consumer Dashboard
- Food scanning
- Expiry tracking
- Personal inventory

### Farmer Dashboard
- Crop management
- Supply chain tracking
- Distribution management

### Manager Dashboard
- Inventory oversight
- Staff coordination
- Reporting

## Common Issues & Solutions

### Build Errors
- Clear cache: `rm -rf node_modules .vite dist`
- Reinstall: `npm install`

### Environment Variables
- Ensure `.env` file exists in root
- Restart dev server after changing `.env`

### API Connection Issues
- Check backend service is running
- Verify API endpoints in `.env`
- Check CORS configuration

## Testing
- Component testing with React Testing Library
- End-to-end testing with Playwright (if configured)
- Manual testing checklist before deployment
