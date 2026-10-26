# 🏥 MediCore - Smart Hospital Management System & Patient Care Portal

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**MediCore** is an enterprise-grade, dual-interface hospital management platform designed for modern healthcare facilities. It seamlessly unifies internal clinic administration with a private, mobile-first patient self-service portal.

---

## ✨ Features at a Glance

### 1. 🛡️ Staff Admin Dashboard (`#adminLayout`)
* **Real-time KPI Statistics**: Instant counters for daily intake, active queue count, emergency cases, available doctors, and revenue in ₹ INR.
* **Triage & Queue Manager**:
  * **Hybrid Auto-Sort Engine**: Toggle between **Auto-Sort ON** (`Emergency > VIP > Regular`) and arrival timestamp sequence.
  * **Doctor Workload Balancer**: Live indicator chips preventing physician bottlenecking with `High Load` alerts.
  * **Patient Actions**: Allot Doctor modal, Mark as Completed, and Remove Patient confirmation.
* **Doctor Directory & Duty Status**:
  * Interactive status controls (`Available`, `Busy`, `In Surgery`, `Off Duty`).
  * Instant One-Click **Quick Toggle** (`Available ↔ Busy`).
* **Billing & Tax Invoice Settlement**:
  * Auto-generates official receipts in ₹ INR with breakdown: Consultation, Bed, Pharmacy, and 18% Healthcare GST.

### 2. 📱 Patient Care Portal (`#patientLayout`)
* **Soft Healthcare Aesthetic**: Calm teal & emerald color scheme optimized for mobile screens with a fixed bottom navigation bar.
* **Next Appointment Hero**: Live card displaying assigned doctor, department, consultation fee, and token sequence.
* **Interactive Doctor Selection Carousel**: Browse physicians by specialty with consultation fees in ₹ INR and ratings before booking.
* **Advanced Queue Predictor**:
  * Calculates estimated wait time specifically based on patients ahead assigned to the *same doctor* and emergency priority insertions.
  * **Smart Arrival Recommendation**: Dynamically predicts arrival time (e.g. *"Arrive by 4:20 PM"*).
  * Animated progress bar and 4-stage milestone tracker.
* **Expected Invoice Estimate**: Real-time breakdown of projected consultation and medicine expenses with uncertainty ranges.

### 3. ⚡ Zero Backend Setup & Instant Cross-Tab Sync
* Built with pure Vanilla HTML5, CSS3, and ES6+ JavaScript.
* Full cross-tab live synchronization via browser `localStorage` and `storage` event listeners.

---

## 🚀 Live Public Deployment Options

See [**DEPLOYMENT.md**](./DEPLOYMENT.md) for full walkthroughs:
* **Option 1: Deploy to Vercel (Recommended)** — zero config, instant HTTPS domain.
* **Option 2: Deploy to Netlify** — drag-and-drop or Git push.
* **Option 3: Free GitHub Pages** — automated deployment via GitHub Actions.

---

## 💻 Local Quick Start

### Method 1: Instant Browser Launch
Simply double-click `run_hospital.bat` or open `index.html` directly in any web browser.

### Method 2: Local HTTP Server (npm)
```bash
npm install
npm start
```
The application will be served locally at `http://localhost:3000`.

---

## 🔑 Demo Credentials

| Portal | Tab | Credentials |
| :--- | :--- | :--- |
| **Staff Admin** | Staff Portal | Username: `admin` <br> Password: `admin123` |
| **Registered Patient** | Patient Portal | Patient ID: `PT-1001` <br> Mobile (last 4): `4432` |
| **Guest Patient** | Patient Portal | Click **Book as New Patient (Guest)** |

---

## 📄 License
This project is licensed under the MIT License - open for personal and commercial usage.
