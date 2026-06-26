# Vercel Deployment Environment Variables

This document lists all required environment variables for deploying FFDS to Vercel.

## Required Environment Variables

### Backend API (Serverless Function)

Set these in your Vercel project settings under **Environment Variables**:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/ffds` | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT token signing/verification | Use a strong random string (min 32 chars) | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI chatbot | `AIza...` | ✅ Yes |
| `CNN_SERVICE_URL` | URL of the CNN service (if deployed separately) | `https://your-cnn-service.vercel.app` | ✅ Yes |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | `https://your-app.vercel.app` or `*` | ✅ Yes |

### Frontend

Set these in your Vercel project settings under **Environment Variables** (prefix with `VITE_`):

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Base URL for API calls | `/api` (for same-domain deployment) or `https://your-api.vercel.app/api` | ✅ Yes |

## Setup Instructions

### 1. Backend Environment Variables

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ffds
JWT_SECRET=<generate-a-strong-random-string-min-32-chars>
GEMINI_API_KEY=<your-gemini-api-key>
CNN_SERVICE_URL=https://your-cnn-service.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

**Important Notes:**
- For `CORS_ORIGIN`, you can use `*` to allow all origins (less secure) or specify your exact frontend domain
- Generate `JWT_SECRET` using: `openssl rand -base64 32` or a similar method
- Do not use the default `test-secret` in production

### 2. Frontend Environment Variables

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add the following variable:

```
VITE_API_BASE_URL=/api
```

**Note:** For same-domain deployment (recommended), use `/api` since Vercel rewrites `/api/*` to the serverless function.

### 3. Redeploy

After setting environment variables:
1. Go to **Deployments** in Vercel
2. Click the **...** menu on your latest deployment
3. Select **Redeploy**

## Common Issues

### Authentication Failed

**Cause:** Missing or incorrect `JWT_SECRET` in Vercel environment variables.

**Solution:**
1. Check that `JWT_SECRET` is set in Vercel environment variables
2. Ensure it's the same value used when tokens were signed
3. Redeploy after setting the variable

### CORS Errors

**Cause:** `CORS_ORIGIN` not set or doesn't include your frontend domain.

**Solution:**
1. Set `CORS_ORIGIN` to your frontend URL (e.g., `https://your-app.vercel.app`)
2. Or set to `*` to allow all origins (less secure)
3. Redeploy after setting the variable

### API Connection Failed

**Cause:** `VITE_API_BASE_URL` not set correctly in frontend.

**Solution:**
1. Set `VITE_API_BASE_URL=/api` for same-domain deployment
2. Or set to full API URL if using separate domains
3. Redeploy after setting the variable

### MongoDB Connection Failed

**Cause:** `MONGODB_URI` not set, incorrect, or MongoDB Atlas IP whitelist issues.

**Solution:**
1. Verify `MONGODB_URI` is set in Vercel environment variables
2. Ensure MongoDB Atlas allows access from Vercel's IP ranges (0.0.0.0/0 for serverless)
3. Check that the database user has correct permissions
4. Ensure connection string includes `retryWrites=true&w=majority`
5. Redeploy after setting the variable

**MongoDB Atlas IP Whitelist for Vercel:**
Since Vercel uses dynamic IP addresses, you should:
- Go to MongoDB Atlas → Network Access
- Add IP address: `0.0.0.0/0` (allows all IPs - less secure but required for serverless)
- Or use VPC peering if you have a paid MongoDB Atlas plan

## Testing

After deployment, test authentication:

1. Navigate to your deployed app
2. Try to login with test credentials:
   - Email: `consumer@example.com`
   - Password: `password123`
3. Check Vercel function logs for any errors:
   - Go to **Deployments** → **View Function Logs**
   - Look for JWT_SECRET warnings or CORS errors

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, random secrets** for `JWT_SECRET`
3. **Rotate secrets periodically** in production
4. **Use specific CORS origins** instead of `*` when possible
5. **Enable IP whitelisting** on MongoDB Atlas for Vercel's IP ranges
6. **Monitor logs regularly** for authentication failures
