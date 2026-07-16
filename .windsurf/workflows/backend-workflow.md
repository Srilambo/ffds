---
description: Backend development workflow for FFDS application
---

# Backend Development Workflow

## Project Structure
```
backend/
├── cnn-service/         # CNN/ML Service for food classification
│   ├── app/             # Flask application
│   │   └── food_classifier.py
│   ├── model/           # Trained models
│   ├── training/        # Training scripts
│   │   └── train_food_classifier.py
│   ├── tests/           # Unit tests
│   ├── data/            # Training data
│   ├── kaggle_raw/      # Raw dataset from Kaggle
│   ├── requirements.txt # Python dependencies
│   ├── render.yaml      # Render deployment config
│   └── .env.example     # Environment variables template
│
└── core-api/            # Core API service
    ├── api/             # API endpoints
    ├── src/             # Source code
    ├── tests/           # Unit tests
    ├── assets/          # Static assets
    ├── uploads/         # File upload directory
    ├── package.json     # Node.js dependencies
    ├── jest.config.js   # Jest testing configuration
    └── .env.example     # Environment variables template
```

## CNN Service (Python/Flask)

### Development Setup
1. **Create virtual environment**
   ```bash
   cd backend/cnn-service
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the service**
   ```bash
   flask run
   ```
   Service will be available at http://localhost:5000

### Training the Model
1. **Prepare dataset**
   - Place training data in `data/` directory
   - Ensure proper folder structure by class

2. **Run training script**
   ```bash
   python training/train_food_classifier.py
   ```

3. **Model will be saved to** `model/` directory

### Testing
```bash
pytest tests/
```

## Core API (Node.js/Express)

### Development Setup
1. **Install dependencies**
   ```bash
   cd backend/core-api
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
   API will be available at http://localhost:3000

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint

## API Architecture

### CNN Service Endpoints
- `POST /classify` - Classify food image
- `GET /health` - Health check
- `GET /model/info` - Model information

### Core API Endpoints
- Authentication: `/api/auth/*`
- Users: `/api/users/*`
- Inventory: `/api/inventory/*`
- Scanning: `/api/scan/*`
- Notifications: `/api/notifications/*`

## Database Integration
- Core API connects to database via environment variables
- Ensure database is running before starting API
- Migration scripts should be run in proper order

## Common Issues & Solutions

### CNN Service Issues
**Import Errors**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

**Model Loading Errors**
- Check model file exists in `model/` directory
- Verify model architecture matches training script

**GPU/CUDA Issues**
- For CPU inference, ensure TensorFlow CPU version is installed
- Check CUDA compatibility for GPU inference

### Core API Issues
**Port Already in Use**
- Kill process using port 3000
- Or change port in `.env` file

**Database Connection**
- Verify database credentials in `.env`
- Ensure database service is running
- Check network connectivity

**Module Not Found**
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall if needed

## Deployment

### CNN Service to Render
1. Push code to GitHub
2. Connect repository to Render
3. Use `render.yaml` for configuration
4. Set environment variables in Render dashboard

### Core API to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy automatically on push

## Development Best Practices
- Use environment variables for all sensitive data
- Never commit `.env` files
- Write unit tests for new features
- Follow existing code style and patterns
- Document API endpoints in code comments
