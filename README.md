# 🚀 DashboardApp

Modern task management application with an interactive dashboard, user management, and authentication, built with Angular and Firebase.

## 📋 Table of Contents
- ✅ Prerequisites
- ⚙️ Installation
- 🔥 Firebase Configuration
- 🏗️ Project Structure
- ✨ Application Features
- 🖥️ Development
- 🚢 Deployment
- 🔧 Troubleshooting
- 📜 License

## ✅ Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git (optional, but recommended)
- Firebase account (free)

## ⚙️ Installation

Quick start to clone and run the application:

```bash
# 1. Clone the repository
git clone https://github.com/DavideDelBimbo/DashboardApp.git
cd DashboardApp

# 2. Install dependencies
npm install

# 3. Start the application
npm start
```

> **Note:** Don't forget to configure your Firebase credentials in the environment files before starting!

## 🔥 Firebase Configuration

### 1️⃣ Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project (e.g., "dashboard-application")

### 2️⃣ Set Up Authentication
- Navigate to "Authentication" → "Sign-in method"
- Enable "Email/Password" provider

### 3️⃣ Configure Realtime Database
- Go to "Realtime Database" in the console
- Create a new database (test mode for development)

### 4️⃣ Update Angular Environment

Edit environment.development.ts:

```typescript
export const environment = {
    production: false,
    apiKey: 'YOUR_API_KEY',
    signupUrl: 'https://identitytoolkit.googleapis.com/v1/accounts:signUp',
    signinUrl: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
    refreshTokenUrl: 'https://securetoken.googleapis.com/v1/token',
    changePasswordUrl: 'https://identitytoolkit.googleapis.com/v1/accounts:update',
    databaseUrl: 'YOUR_DATABASE_URL',
};
```

Replace the placeholders with your Firebase project credentials.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── auth/         # Authentication components and services
│   ├── components/   # UI components
│   ├── models/       # Data models
│   ├── services/     # Data services
│   └── ...
├── environments/     # Environment configurations
└── ...
```

## ✨ Application Features

### 🔐 Authentication
- User registration and login
- Automatic token refresh
- Secure session management
- Logout functionality

### 📝 Task Management
- Create, read, update and delete tasks
- Assign tasks to team members
- Task filtering and sorting

### 📊 Dashboard
- Real-time KPI visualization
- Interactive charts:
  - Priority distribution
  - Status breakdown
  - User workload
  - Progress over time

### 👤 Profile Settings
- Edit personal information
- Upload profile picture
- Change password

## 🖥️ Development

Start the development server:

```bash
npm start
# or
npx ng serve
```

Visit `http://localhost:4200/` in your browser.

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output is generated in `dist/dashboard-app/`.

### Deploy to Firebase Hosting

```bash
# Install Firebase tools
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Hosting)
firebase init

# Deploy your application
firebase deploy
```

### Database Security Rules

Example `database.rules.json`:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "posts": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **Firebase authentication errors** | Check API key and authentication settings |
| **Database access issues** | Verify database URL and security rules |
| **Compilation errors** | Run `npm install` to update dependencies |

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.