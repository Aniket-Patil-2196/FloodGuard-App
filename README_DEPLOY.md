# Deployment Guide

This project is structured as a full-stack application with a React frontend and a Node.js backend.

## 🚀 Vercel Deployment (Frontend)

The `vercel.json` file is already configured to build the frontend from the `frontend` directory.

### Steps to Deploy:

1.  **Import Project**: Import your GitHub repository into Vercel.
2.  **Configure Environment Variables**:
    *   Go to **Settings** -> **Environment Variables**.
    *   Add `VITE_API_URL` and set its value to your **Render Backend URL** (e.g., `https://your-backend.onrender.com`).
3.  **Deploy**: Vercel will automatically build and deploy your frontend.

---

## 🌐 Render Deployment (Backend)

### Steps to Deploy:

1.  **Create Web Service**: In Render, create a new "Web Service".
2.  **Root Directory**: Set to `backend`.
3.  **Build Command**: `npm install`
4.  **Start Command**: `npm start`
5.  **Environment Variables**:
    *   `PORT`: `5000` (or your preferred port)
    *   `JWT_SECRET`: Your secret key for JWT.
    *   `MONGO_URI`: Your MongoDB connection string.
    *   `NODE_ENV`: `production`

---

## 🛠️ API Call Example (Frontend)

All API calls must include the `Authorization` header with the JWT token.

```javascript
import { API_URL } from '../config';

const fetchData = async () => {
  const user = JSON.parse(localStorage.getItem('user')); // Get user from storage
  
  if (!user || !user.token) {
    console.error('No token found');
    return;
  }

  const response = await fetch(`${API_URL}/api/your-endpoint`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.token}` // MUST use Bearer format
    }
  });

  if (response.status === 401) {
    // Handle unauthorized (e.g., logout user)
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  const data = await response.json();
  console.log(data);
};
```

## ✅ Fixes Applied:

1.  **Vercel Config**: Updated `vercel.json` to use `frontend` as root and `dist` as output.
2.  **Authorization Header**: Fixed header format to `Bearer ${token}` across all pages.
3.  **Data Rendering**: Added `Array.isArray()` checks to prevent crashes when API returns non-array data.
4.  **Chart Warning**: Fixed `ResponsiveContainer` styling in `UserDashboard.tsx`.
5.  **Unauthorized Handling**: Added logic to logout users on 401 responses.
