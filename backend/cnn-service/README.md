# CNN Service

Python/Flask service for food image classification using machine learning.

## Purpose
This service provides food classification capabilities using a Convolutional Neural Network (CNN) trained on food datasets.

## Tech Stack
- **Language**: Python 3
- **Framework**: Flask
- **ML Framework**: TensorFlow/Keras
- **Deployment**: Render

## Directory Structure

```
cnn-service/
├── app/
│   └── food_classifier.py    # Main Flask app with classification endpoint
├── model/                    # Trained model files (.h5, .json)
├── training/
│   └── train_food_classifier.py  # Model training script
├── tests/                    # Unit tests
├── data/                     # Training datasets
├── kaggle_raw/               # Raw data from Kaggle
├── requirements.txt          # Python dependencies
├── render.yaml               # Render deployment configuration
└── .env.example              # Environment variables template
```

## Setup

### Local Development

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
flask run
```

Service will be available at http://localhost:5000

## Training the Model

### Prepare Dataset
1. Organize images in `data/` by class folders
2. Ensure consistent image sizes
3. Split into train/validation/test sets

### Train Model
```bash
python training/train_food_classifier.py
```

The trained model will be saved to the `model/` directory.

## API Endpoints

### POST /classify
Classify a food image.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: image file

**Response:**
```json
{
  "class": "food_class_name",
  "confidence": 0.95,
  "classes": {
    "class1": 0.95,
    "class2": 0.03,
    "class3": 0.02
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### GET /model/info
Get model information.

**Response:**
```json
{
  "model_name": "food_classifier_v1",
  "classes": ["apple", "banana", "orange"],
  "input_shape": [224, 224, 3],
  "accuracy": 0.92
}
```

## Environment Variables

```env
FLASK_ENV=production
SECRET_KEY=your_secret_key_here
MODEL_PATH=./model
PORT=5000
```

## Testing

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_classifier.py

# Run with coverage
pytest --cov=app tests/
```

## Deployment

### Deploy to Render
1. Push code to GitHub
2. Create new web service in Render
3. Connect repository
4. Use `render.yaml` for configuration
5. Set environment variables in Render dashboard

## Model Architecture

The CNN model uses:
- Convolutional layers for feature extraction
- Max pooling for dimensionality reduction
- Dropout for regularization
- Dense layers for classification
- Softmax output for multi-class prediction

## Troubleshooting

### Model Loading Issues
- Ensure model files exist in `model/` directory
- Check TensorFlow version compatibility
- Verify model architecture matches training script

### Out of Memory Errors
- Reduce batch size in training
- Use smaller image dimensions
- Close other applications using GPU

### Slow Inference
- Consider using GPU on Render
- Optimize model size
- Implement model quantization

## Related Documentation
- [Backend Workflow](../../../.windsurf/workflows/backend-workflow.md)
- [Deployment Workflow](../../../.windsurf/workflows/deployment-workflow.md)
