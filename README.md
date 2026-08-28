# 🏥 ClinicFlow Management System

![ClinicFlow Management System Banner](preview/logo.png)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge&logo=vercel)](https://life-clinic-management-system.vercel.app)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.1.0-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.12-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> 🚀 **Live Application**: [life-clinic-management-system.vercel.app](https://life-clinic-management-system.vercel.app)

A modern, secure, and feature-rich clinic management system built with React 19, Firebase, and Tailwind CSS. Streamline your healthcare operations with comprehensive patient management, appointment scheduling, prescription management, billing systems, and role-based access control.

## 🔧 Authentication Fixes

The authentication flow was updated to fix accounts that could be created successfully but could not reach their dashboard after signing in.

- Firebase email addresses are normalized by trimming whitespace and converting them to lowercase.
- Signup creates the staff profile, sends the verification email, and signs the user out before redirecting to login.
- Login no longer depends on a Firestore profile read or write to complete Firebase authentication and dashboard routing.
- Doctor accounts route to `/doctor`; receptionist accounts route to `/receptionist`.
- Staff roles are normalized consistently, including existing profiles containing uppercase letters or extra spaces.
- Login falls back to the selected role when Firestore profile access is temporarily denied.
- Invalid role selections and failed login attempts clear the Firebase session.

### Firestore Permissions

Firebase Authentication and Firestore have separate permissions. If the dashboard displays permission errors or missing data, publish the project rules from [firestore.rules](firestore.rules) in the Firebase Console. Firestore permissions must allow authenticated users to read the collections required by their dashboard.

## 🛠️ Tech Stack

Our clinic management system is built with cutting-edge technologies to ensure performance, security, and scalability:

### **Frontend Technologies**
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.12-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

### **Backend & Database**
![Firebase](https://img.shields.io/badge/Firebase-12.1.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Firestore-NoSQL-FF6B6B?style=for-the-badge&logo=firebase&logoColor=white)
![Authentication](https://img.shields.io/badge/Firebase_Auth-Secure-FF6B6B?style=for-the-badge&logo=firebase&logoColor=white)

### **Development Tools**
![ESLint](https://img.shields.io/badge/ESLint-9.33.0-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![PostCSS](https://img.shields.io/badge/PostCSS-8.5.6-DD3A0A?style=for-the-badge&logo=postcss&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

### **Deployment & Hosting**
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)

## ✨ Features

### 🔐 **Authentication & Security**
- **Firebase Authentication** with email/password
- **Email Verification** for account activation
- **Password Reset** functionality
- **Role-Based Access Control** (Doctor & Receptionist)
- **Protected Routes** for unauthorized access prevention
- **Secure Firestore Rules** for data protection

### 👨‍⚕️ **Doctor Dashboard**
- **Real-time Statistics** (appointments, waiting patients, prescriptions)
- **Appointment Management** with patient details
- **Prescription Creation & Management**
- **Medicine Database** with search and filtering
- **Patient Queue Management** with token system
- **Prescription History** and editing capabilities

### 🏥 **Receptionist Dashboard**
- **Appointment Scheduling** and management
- **Token Management** system for patient queues
- **Patient Registration** and information management
- **Prescription Viewing** and management
- **Real-time Updates** across all systems

### 💰 **Billing & Payment System**
- **Invoice Creation** with detailed itemization
- **Multiple Payment Methods** (Cash, Card, Online)
- **Payment Processing** and status tracking
- **Payment History** and reporting
- **PDF Generation** for invoices and prescriptions
- **Revenue Analytics** and financial reports

### 📱 **Modern UI/UX**
- **Responsive Design** for all devices
- **Beautiful Gradients** and modern aesthetics
- **Real-time Updates** with Firebase listeners
- **Interactive Components** with smooth animations
- **Toast Notifications** for user feedback
- **Search & Filter** capabilities throughout

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database** (test mode)
5. Get your Firebase configuration

### 3. Environment Configuration
   ```bash
   cp env.example.txt .env
   ```

Update `.env` with your Firebase config:
   ```env
VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 4. Firebase Security Rules Configuration

**Important**: You must configure Firestore security rules to ensure proper data access control.

1. **Go to Firestore Database** in your Firebase Console
2. **Click on "Rules" tab**
3. **Replace the default rules** with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Staff data access control
    match /staffData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Appointments access control
    match /appointments/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.createdBy == request.auth.uid);
    }
    
    // Prescriptions access control
    match /prescriptions/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.doctorId == request.auth.uid);
    }
    
    // Medicines access control
    match /medicines/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Invoices access control
    match /invoices/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.createdBy == request.auth.uid);
    }
  }
}
```

4. **Click "Publish"** to save the rules

**Why These Rules Matter:**
- **Security**: Prevents unauthorized access to sensitive data
- **Role-based Access**: Ensures users can only access their own data
- **Data Protection**: Protects patient information and medical records
- **Compliance**: Meets healthcare data security requirements

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your application!

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LogoutButton.jsx
│   ├── ProtectedRoute.jsx
│   ├── EmailVerificationStatus.jsx
│   └── TokenDisplay.jsx
├── contexts/           # React context providers
│   └── AuthContext.jsx
├── firebase/           # Firebase configuration
│   └── config.js
├── hooks/              # Custom React hooks
│   └── useAuth.js
├── pages/              # Application pages
│   ├── auth/           # Authentication pages
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── ForgotPasswordForm.jsx
│   │   └── VerifyEmail.jsx
│   ├── doctor/         # Doctor-specific pages
│   │   ├── Doctor.jsx
│   │   ├── appointment/
│   │   ├── prescriptions/
│   │   └── token/
│   ├── receptionist/   # Receptionist-specific pages
│   │   ├── Receptionist.jsx
│   │   ├── appointment/
│   │   ├── billing/
│   │   ├── prescriptions/
│   │   └── token/
│   └── Home.jsx
├── utils/              # Utility functions
│   └── authUtils.js
├── App.jsx             # Main application component
└── main.jsx            # Application entry point
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint for code quality |

## 🌐 Deployment

This application is deployed on **Vercel** and is live at:
**[life-clinic-management-system.vercel.app](https://life-clinic-management-system.vercel.app)**


## 🔒 Security Features

- **Email verification** required for account activation
- **Role-based access control** with protected routes
- **Secure password reset** via email
- **Firestore security rules** for data protection
- **Authentication state management** with React Context
- **Protected API endpoints** and data access

## 📧 Email Verification System

The system uses Firebase's built-in email verification:

1. **Automatic Email**: Sent when users sign up
2. **Verification Status**: Real-time display on dashboard
3. **Manual Refresh**: Users can check verification status
4. **Reliable System**: Direct integration with Firebase Auth

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Beautiful icons

### Backend & Database
- **Firebase Authentication** - User management
- **Firestore** - NoSQL cloud database
- **Firebase Security Rules** - Data access control

### Development Tools
- **ESLint** - Code quality and consistency
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📱 Responsive Design

- **Mobile-first** approach
- **Tablet** and **desktop** optimized
- **Touch-friendly** interface
- **Cross-browser** compatibility

## 🔄 Real-time Features

- **Live Updates** with Firebase listeners
- **Real-time Statistics** on dashboards
- **Instant Notifications** for actions
- **Live Patient Queue** management

## 📊 Data Management

- **Patient Records** with comprehensive information
- **Appointment Scheduling** with date/time management
- **Prescription Management** with medicine database
- **Billing System** with invoice generation
- **Token System** for patient queue management
