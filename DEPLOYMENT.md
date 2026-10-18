# 🚀 GridHeal Deployment Guide

This guide covers deploying the full-stack GridHeal platform (React + TypeScript frontend + Python FastAPI backend + MongoDB Atlas).

---

## 🌟 Method 1: Deploy to Render (Recommended & Configured)

Render is pre-configured with `render.yaml` to deploy both services automatically from your GitHub repository.

### Step-by-Step Instructions:

1. **Push your code to GitHub**:
   Ensure your latest code is pushed to your GitHub repository:
   ```bash
   git push origin branch:main
   ```

2. **Log in to Render**:
   - Go to [render.com](https://render.com/) and sign in with your GitHub account.

3. **Deploy via Blueprint (One Click)**:
   - Click the **"New +"** button at the top right of your Render dashboard.
   - Select **"Blueprint"**.
   - Connect your GitHub repository (`samarthdarak24-cpu/energy-simulation`).
   - Render will automatically detect [`render.yaml`](./render.yaml) and configure two services:
     1. **`gridheal-backend`** (Python FastAPI Web Service)
     2. **`gridheal-frontend`** (Vite React Static Site)

4. **Set Environment Variables in Render**:
   In the Render setup screen or service settings:
   - **`gridheal-backend`**:
     - `MONGODB_URL`: Your MongoDB Atlas connection string (`mongodb+srv://...`)
     - `WEATHER_API_KEY`: Your free WeatherAPI key from [weatherapi.com](https://www.weatherapi.com/)
     - `MONGODB_DB_NAME`: `gridheal` (default)
   - **`gridheal-frontend`**:
     - `VITE_API_URL` is automatically linked to your `gridheal-backend` service!

5. **Click "Apply"**:
   - Render will build and deploy both services.
   - Once complete, Render provides you with a live URL (e.g. `https://gridheal-frontend.onrender.com`).

---

## ⚡ Method 2: Manual Render Setup (If not using Blueprint)

If you prefer setting up the services manually in Render:

### Backend Service:
1. Click **New +** ➔ **Web Service** ➔ Select repository.
2. Settings:
   - **Name**: `gridheal-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
3. Add Environment Variables:
   - `MONGODB_URL`: your connection string
   - `WEATHER_API_KEY`: your weatherapi.com key

### Frontend Service:
1. Click **New +** ➔ **Static Site** ➔ Select repository.
2. Settings:
   - **Name**: `gridheal-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-name.onrender.com`
4. Under **Redirects/Rewrites**:
   - Add Rewrite: `/*` ➔ `/index.html` (Status: `Rewrite`)

---

## 🌐 Method 3: Deploy Frontend to Vercel + Backend to Render

If you prefer Vercel for the frontend:

1. **Deploy Frontend on Vercel**:
   - Import your GitHub repo into [vercel.com](https://vercel.com/).
   - Framework Preset: `Vite`.
   - Add Environment Variable:
     - `VITE_API_URL`: Your deployed backend URL (e.g., `https://gridheal-backend.onrender.com`).
   - Click **Deploy**!
   - [`vercel.json`](./vercel.json) is already included for SPA routing.
