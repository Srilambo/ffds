# Core API

Node.js/Express REST API for the FFDS application business logic and data management.

## Purpose
This API handles authentication, user management, inventory tracking, and integrates with the CNN service for food classification.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Testing**: Jest
- **Deployment**: Vercel (Serverless)

## Directory Structure

```
core-api/
├── api/                    # API endpoint definitions (serverless functions)
├── src/                    # Source code
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   └── utils/              # Utility functions
├── tests/                  # Jest unit tests
├── assets/                 # Static assets
├── uploads/                # File upload directory
├── package.json            # Dependencies and scripts
├── jest.config.js          # Jest configuration
└── .env.example            # Environment variables template
```

## Setup

### Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

API will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Scanning
- `POST /api/scan` - Submit food scan
- `GET /api/scan/:id` - Get scan result
- `GET /api/scan/history` - Get scan history

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CNN_SERVICE_URL=https://your-cnn-service.onrender.com
NODE_ENV=development
```

## Database Schema

### Users Table
- id (UUID, primary key)
- email (string, unique)
- password_hash (string)
- role (enum: admin, consumer, farmer, manager)
- name (string)
- created_at (timestamp)
- updated_at (timestamp)

### Inventory Table
- id (UUID, primary key)
- user_id (UUID, foreign key)
- food_name (string)
- food_class (string)
- expiry_date (date)
- image_url (string)
- created_at (timestamp)

### Scans Table
- id (UUID, primary key)
- user_id (UUID, foreign key)
- image_url (string)
- classification_result (json)
- confidence_score (float)
- created_at (timestamp)

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- inventory.test.js
```

## Integration with CNN Service

The Core API integrates with the CNN Service for food classification:

```javascript
const classification = await axios.post(
  `${process.env.CNN_SERVICE_URL}/classify`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);
```

## Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy automatically on push

API routes in `api/` directory automatically become serverless functions.

## Middleware

### Authentication
JWT token verification for protected routes.

### Error Handling
Global error handler for consistent error responses.

### CORS
Cross-Origin Resource Sharing configuration.

### Rate Limiting
Request rate limiting to prevent abuse.

## Development Best Practices

- Use async/await for asynchronous operations
- Implement proper error handling
- Validate input data
- Use environment variables for sensitive data
- Write unit tests for new features
- Follow RESTful API conventions
- Document API endpoints with comments

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure database is accessible
- Check network connectivity

### JWT Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure token is sent in Authorization header

### CNN Service Connection
- Verify CNN_SERVICE_URL is correct
- Check CNN service is running
- Handle timeouts appropriately

## Related Documentation
- [Backend Workflow](../../../.windsurf/workflows/backend-workflow.md)
- [Deployment Workflow](../../../.windsurf/workflows/deployment-workflow.md)
