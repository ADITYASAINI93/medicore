# 🌐 MediCore Hospital System - Public Deployment Guide

This guide explains how to publish the **MediCore Hospital Management System** live on the internet with a public HTTPS URL in under 2 minutes.

---

## 🛠️ Step 0: Create a GitHub Repository (Recommended)

1. Open [GitHub.com](https://github.com) and click **New Repository**.
2. Name it `medicore-hospital` (or any name you prefer).
3. Set visibility to **Public**.
4. Do NOT initialize with a README (one is already prepared).
5. Open your terminal in the `medicore_hospital` directory and run:

```bash
cd medicore_hospital
git init
git add .
git commit -m "feat: initial MediCore hospital deployment release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/medicore-hospital.git
git push -u origin main
```

---

## 🚀 Option 1: Deploy to Vercel (Fastest & Recommended)

Vercel provides instant global CDN hosting with free SSL certificates.

### Method A: Connect through GitHub (Easiest)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** → **Project**.
3. Select your `medicore-hospital` repository and click **Import**.
4. Leave all build settings at default (`Framework: Other`, `Root Directory: ./`).
5. Click **Deploy**.
6. Within 15 seconds, your live production URL (e.g. `https://medicore-hospital.vercel.app`) will be active!

### Method B: Deploy from Terminal (Vercel CLI)
```bash
cd medicore_hospital
npx vercel
```
Follow the interactive prompts (defaults are pre-configured in `vercel.json`).

---

## 🌩️ Option 2: Deploy to Netlify

### Method A: Netlify Drop (Zero Git Required!)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the entire `medicore_hospital` folder into the browser window.
3. Your site is deployed immediately with a live URL (e.g. `https://festive-medicore.netlify.app`).

### Method B: Netlify via GitHub
1. Log in to [Netlify](https://www.netlify.com).
2. Click **Add new site** → **Import an existing project**.
3. Select GitHub and choose your `medicore-hospital` repository.
4. Leave Publish directory as `.` (configured in `netlify.toml`).
5. Click **Deploy Site**.

---

## 🐙 Option 3: Deploy to GitHub Pages (100% Free Forever)

This project includes a pre-configured GitHub Actions workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

1. Push the code to GitHub as shown in Step 0.
2. In your GitHub repository, click on **Settings** → **Pages** (under Code and automation in the left sidebar).
3. Under **Build and deployment**:
   - Change **Source** to **GitHub Actions**.
4. Go to the **Actions** tab in your repository — you will see the `Deploy MediCore to GitHub Pages` workflow running automatically.
5. In ~1 minute, your site will be live at:
   `https://YOUR_USERNAME.github.io/medicore-hospital/`

---

## ⚡ Option 4: Render / Cloudflare Pages

### Cloudflare Pages:
1. Go to Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages**.
2. Connect your GitHub repository.
3. Build command: *(leave empty)*.
4. Build output directory: *(leave empty or `/`)*.
5. Click **Save and Deploy**.

### Render:
1. Go to [render.com](https://render.com) → **New** → **Static Site**.
2. Connect your GitHub repository.
3. Publish directory: `.`.
4. Click **Create Static Site**.

---

## 🔒 Post-Deployment Verification Checklist

- [x] **Staff Portal**: Log in with `admin` / `admin123`.
- [x] **Admit Patient**: Submit a new patient and check the Queue table.
- [x] **Auto-Sort**: Toggle Auto-Sort and verify triage sequencing.
- [x] **Doctor Management**: Change doctor availability and test the Available ↔ Busy quick switch.
- [x] **Patient Portal**: Test Patient Login with `PT-1001` / `4432` or book as Guest.
- [x] **Queue Predictor**: Verify dynamic wait time estimation and arrival recommendations.
- [x] **Dark / Light Mode**: Click the theme toggle icon.
