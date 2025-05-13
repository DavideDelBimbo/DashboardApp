# DashboardApp

Task management application with dashboard, user management and authentication, developed with Angular and Firebase.

## Table of Contents
- Prerequisites
- Installation
- Firebase configuration
- Project structure
- Application features
- Starting in development environment
- Build and deployment
- Troubleshooting

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git (optional, but recommended)
- Firebase account (free)

## Installation in an isolated environment

Follow these steps to clone and start the application:

### 1. Clone the repository
```bash
git clone https://github.com/DavideDelBimbo/DashboardApp.git
cd DashboardApp
```

### 3. Install dependencies
```bash
npm install
```

### 4. Edit the environment files with Firebase credentials
Update the `src/environments/environment.development.ts` file with your Firebase project credentials (see [Firebase Configuration](#firebase-configuration) for details).

### 5. Start the application
```bash
npm start
```

## Firebase Configuration

### 1. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., "dashboard-application")
3. Follow the guided procedure for basic configuration

### 2. Authentication Configuration

1. In the Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable the "Email/Password" provider

### 3. Realtime Database Configuration

1. Go to "Realtime Database" in the console
2. Create a new database
3. Start in test mode (for development)
4. Note the database URL

### 4. Angular project configuration

Edit the `environment.development.ts` file with your Firebase credentials:

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

Replace:
- `YOUR_API_KEY` with the Firebase Web API Key (Project settings → General → Web API Key)
- `YOUR_DATABASE_URL` with your Realtime Database URL (ends with `/`)

## Project Structure

The application is organized into the following main sections:

- auth: Authentication management
- components: Interface components
- models: Data models
- services: Services for data access
- environments: Environment configurations

## Application Features

### Authentication
- User registration
- User login
- Session management with automatic token refresh
- Logout

### Task Management
- Create new tasks
- Assign tasks to users
- Edit and update tasks
- Delete tasks

### Dashboard
- KPI visualization (total tasks, completion rate)
- Statistical charts:
  - Distribution by priority
  - Distribution by status
  - Tasks by user
  - Task trends over time

### Profile Settings
- Edit user information
- Avatar upload
- Password change

## Starting in Development Environment

### Using NPM script

```bash
npm start
```

### Using local Angular CLI

```bash
npx ng serve
```

The application will be available at `http://localhost:4200/`

## Build and Deployment

### Production Build

```bash
npm run build
# or
npx ng build --configuration production
```

The compiled files will be available in the `dist/dashboard-app/` folder.

### Deployment to Firebase Hosting

1. Install Firebase CLI (globally or locally)
```bash
npm install -g firebase-tools
# or locally
npm install firebase-tools --save-dev
```

2. Log in to your Firebase account
```bash
firebase login
# or with local installation
npx firebase login
```

3. Initialize the Firebase project
```bash
firebase init
# or
npx firebase init
```
Select Hosting, choose your project, and specify `dist/dashboard-app` as the public directory.

4. Deploy
```bash
firebase deploy
# or
npx firebase deploy
```

### Security Rules for Realtime Database

Configure security rules in the `database.rules.json` file:

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

## Troubleshooting

### Common issues

1. **Firebase authentication error**
   - Verify that the apiKey is correct
   - Check that email/password authentication is enabled

2. **Database not accessible**
   - Verify the database URL
   - Check the Realtime Database security rules

3. **Compilation errors**
   - Run `npm install` to update dependencies
   - Verify that all dependencies are installed