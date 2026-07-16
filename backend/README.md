# Backend - FFDS Application

Backend services for the Food Freshness Detection System.

## Architecture

The backend consists of two separate services:

### 1. CNN Service (`cnn-service/`)
Python/Flask service for food image classification using machine learning.

- **Framework**: Flask
- **ML Framework**: TensorFlow/Keras
- **Language**: Python 3
- **Deployment**: Render

### 2. Core API (`core-api/`)
Node.js/Express REST API for business logic and data management.

- **Framework**: Express.js
- **Language**: Node.js (JavaScript)
- **Database**: PostgreSQL
- **Deployment**: Vercel (Serverless)

## Directory Structure

```
backend/
├── cnn-service/         # Python ML Service
│   ├── app/             # Flask application code
│   │   └── food_classifier.py  # Main classification endpoint
│   ├── model/           # Trained ML models
│   ├── training/        # Model training scripts
│   │   └── train_food_classifier.py
│   ├── tests/           # Unit tests
│   ├── data/            # Training datasets
│   ├── kaggle_raw/      # Raw data from Kaggle
│   ├── requirements.txt # Python dependencies
│   ├── render.yaml      # Render deployment config
│   └── .env.example     # Environment variables template
│
└── core-api/            # Node.js Core API
    ├── api/             # API endpoint definitions
    ├── src/             # Source code (controllers, models, services)
    ├── tests/           # Jest unit tests
    ├── assets/          # Static assets
    ├── uploads/         # File upload directory
    ├── package.json     # Node.js dependencies
    ├── jest.config.js   # Jest configuration
    └── .env.example     # Environment variables template
```

## CNN Service Setup

```bash
cd backend/cnn-service

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env

# Run service
flask run
```

## Core API Setup

```bash
cd backend/core-api

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run development server
npm run dev
```

## API Endpoints

### CNN Service (Port 5000)
- `POST /classify` - Classify food image
- `GET /health` - Health check
- `GET /model/info` - Model information

### Core API (Port 3000)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/inventory` - Get inventory items
- `POST /api/scan` - Submit food scan
- `GET /api/notifications` - Get user notifications

## Environment Variables

### CNN Service
```env
FLASK_ENV=production
SECRET_KEY=your_secret_key
MODEL_PATH=./model
```

### Core API
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
CNN_SERVICE_URL=http://localhost:5000
```

## Development Notes

### CNN Service
- Train models using scripts in `training/`
- Place trained models in `model/` directory
- Use virtual environment to isolate dependencies
- Test classification before deploying

### Core API
- Follow MVC pattern in `src/` directory
- Use environment variables for sensitive data
- Write unit tests for new endpoints
- Ensure proper error handling

## Related Documentation
- [Backend Workflow](../../.windsurf/workflows/backend-workflow.md)
- [Deployment Workflow](../../.windsurf/workflows/deployment-workflow.md)
