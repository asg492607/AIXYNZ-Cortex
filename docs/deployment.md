# Deployment Guide

This guide explains how to transition Cortex from Demo Mode into a **Live Production Environment**.

## Prerequisites

1. **Docker & Docker Compose** installed.
2. A **Firebase/Firestore** project.
3. API Keys for integrations (Groq, AWS, GitHub, Jira).

## 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database** in Native mode.
3. Enable **Authentication** (Email/Password).
4. Go to Project Settings -> Service Accounts -> **Generate New Private Key**.
5. Save the downloaded file as `backend/serviceAccountKey.json`.

*Note: The presence of `serviceAccountKey.json` automatically disables Demo Mode and enables Live Mode.*

## 2. Environment Configuration
Copy the template and fill it out:
```bash
cp .env.example .env
```

Ensure the following are set in your `.env`:
```env
USE_RQ=true
REDIS_URL=redis://redis:6379

GROQ_API_KEY=your-groq-key
GITHUB_TOKEN=your-github-token

JIRA_URL=https://yourorg.atlassian.net
JIRA_USERNAME=your-email
JIRA_API_TOKEN=your-jira-token
```

## 3. Deployment
Deploy the full stack using Docker Compose:

```bash
docker compose up -d --build
```

This will spin up:
- `redis`: The task queue.
- `api`: The FastAPI backend connected to Firestore.
- `worker`: The RQ worker waiting for scan jobs.
- `frontend`: The React SPA served via Nginx.

## 4. Bootstrapping the Admin User
Because Firebase Authentication is empty on a fresh project, you must create your first user manually in the Firebase Auth console, or use the Firebase Client SDK in the frontend to register.

Once the user is registered, Cortex will automatically provision an Organization and assign the `admin` role upon first login.
