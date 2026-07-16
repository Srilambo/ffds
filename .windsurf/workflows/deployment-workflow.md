---
description: Complete deployment workflow for FFDS application
---

# Deployment Workflow

## Overview
The FFDS application consists of three main services:
1. **Frontend** - React/Vite application (Vercel)
2. **Core API** - Node.js/Express backend (Vercel)
3. **CNN Service** - Python/Flask ML service (Render)

## Prerequisites
- GitHub repository with all code
- Vercel account (for frontend and core-api)
- Render account (for cnn-service)
- Domain name (optional, for custom domains)

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
1. Ensure all environment variables are set in Vercel dashboard
2. Verify `package.json` has correct build script
3. Test build locally: `npm run build`

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select `frontend/` directory as root directory
5. Configure build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables from `.env.example`
7. Click "Deploy"

### Step 3: Configure Domain (Optional)
1. Go to project settings in Vercel
2. Add custom domain
3. Update DNS records as instructed

## Core API Deployment (Vercel)

### Step 1: Prepare Core API
1. Ensure all environment variables are documented
2. Verify `package.json` has correct start script
3. Test locally: `npm run start`

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select `backend/core-api/` directory as root directory
5. Configure build settings:
   - Framework: Other
   - Build Command: (leave empty for Node.js)
   - Output Directory: (leave empty)
6. Add environment variables from `.env.example`
7. Click "Deploy"

### Step 3: Configure Serverless Functions
- API routes in `api/` directory automatically become serverless functions
- Ensure proper error handling for serverless environment
- Configure timeouts for long-running operations

## CNN Service Deployment (Render)

### Step 1: Prepare CNN Service
1. Ensure `requirements.txt` is complete
2. Verify `render.yaml` configuration
3. Test locally with Flask

### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Configure settings:
   - Root Directory: `backend/cnn-service`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `flask run --host=0.0.0.0 --port=$PORT`
6. Add environment variables from `.env.example`
7. Click "Create Web Service"

### Step 3: Configure Service
- Set up persistent disk for model files if needed
- Configure health checks
- Set up auto-deploys from main branch

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-core-api.vercel.app
VITE_CNN_SERVICE_URL=https://your-cnn-service.onrender.com
```

### Core API (.env)
```
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
CNN_SERVICE_URL=https://your-cnn-service.onrender.com
```

### CNN Service (.env)
```
FLASK_ENV=production
SECRET_KEY=your_secret_key
MODEL_PATH=./model
```

## Post-Deployment Checklist

### Frontend
- [ ] All pages load correctly
- [ ] API calls work without CORS errors
- [ ] Images and static assets load
- [ ] Responsive design works on mobile
- [ ] Environment variables are properly set

### Core API
- [ ] All endpoints respond correctly
- [ ] Database connections work
- [ ] Authentication functions properly
- [ ] Error handling returns proper status codes
- [ ] Logs are accessible

### CNN Service
- [ ] Health check endpoint responds
- [ ] Model loads successfully
- [ ] Classification endpoint works
- [ ] Response times are acceptable
- [ ] Memory usage is within limits

## Monitoring and Maintenance

### Vercel Monitoring
- View logs in Vercel dashboard
- Set up error tracking (Sentry, etc.)
- Monitor build times and failures
- Check analytics for performance

### Render Monitoring
- View logs in Render dashboard
- Monitor resource usage
- Set up alerts for downtime
- Check response times

### Database Maintenance
- Regular backups
- Index optimization
- Query performance monitoring
- Storage usage tracking

## Troubleshooting

### Frontend Issues
**Build Failures**
- Check build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

**API Connection Errors**
- Check CORS configuration
- Verify API URLs are correct
- Ensure backend services are running

### Backend Issues
**Database Connection**
- Verify DATABASE_URL is correct
- Check database service status
- Ensure IP whitelist allows Vercel/Render

**Serverless Timeouts**
- Optimize long-running operations
- Consider moving to dedicated server
- Implement async processing

### CNN Service Issues
**Model Loading Failures**
- Ensure model files are included in deployment
- Check file paths in code
- Verify model compatibility

**Slow Response Times**
- Consider using GPU instances
- Optimize model size
- Implement caching

## Continuous Deployment

### Automatic Deployments
- Both Vercel and Render auto-deploy on push to main branch
- Use feature branches for development
- Pull requests for code review
- Merge to main for deployment

### Deployment Pipeline
1. Create feature branch
2. Make changes and test locally
3. Push to GitHub
4. Create pull request
5. Review and test
6. Merge to main branch
7. Automatic deployment triggers
8. Verify deployment in staging/production

## Rollback Procedures

### Vercel Rollback
1. Go to project deployments
2. Find previous successful deployment
3. Click "Promote to Production"
4. Or revert specific commit

### Render Rollback
1. Go to service deployments
2. Find previous successful deployment
3. Click "Redeploy" on that commit
4. Or manually revert code and push

## Security Considerations
- Never commit `.env` files
- Use strong secrets and passwords
- Enable HTTPS everywhere
- Implement rate limiting
- Regular dependency updates
- Monitor for security vulnerabilities
