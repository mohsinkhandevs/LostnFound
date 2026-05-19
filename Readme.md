# 🔍 Lost & Found Portal

A premium, state-of-the-art Full-Stack Lost & Found Portal designed specifically for universities and organizations. Crafted with high-contrast glassmorphic visuals, fluid CSS transitions, and advanced serverless-ready architectures.

This project couples a React Vite SPA frontend with a robust Node.js/Express and MongoDB backend, utilizing premium matching engines and claims management mechanisms.

---

## 🚀 Key Advanced Enhancements

### 🧠 1. Intelligent Matching Engine
Our advanced recommendation system automates connections between lost and found items:
*   **Compound Text Indexing**: Employs compound Mongoose text search indexes (`{ item_name: "text", description: "text" }`) across both database collections.
*   **Weighted Search Scores**: Calculates match weights dynamically based on text relevance, keyword matching, and strict category alignment.
*   **Algorithmic Match Percentage**: Scores recommended matches on a scale of `0%` to `100%`, and renders matching alert bells dynamically inside the dashboard.
*   **Real-time Match Alert Notifications**: A dynamic bell jiggles and alerts users immediately if active matches are found for their reports.

### 🛡️ 2. Claims Reconciliation & Privacy Flow
Allows claimants to assert ownership securely, while maintaining strict data privacy:
*   **Verification Proof Forms**: Claims require a verified Student ID number alongside a detailed explanation or proof of ownership.
*   **Finder-Only Privacy Protection**: *Original Finders* are strictly verified at the controller level before claimant Student IDs or proof texts are exposed. Unprivileged users cannot retrieve claim metadata.
*   **Inline Reconciliation Actions**: Finders can instantly **"Approve Claim"** or **"Reject Claim"** directly from their private claims inbox.
*   **CSS Confetti Celebrations**: Successful approval triggers client-side confetti showers, offering delightful visual micro-interactions.

### 💾 3. State-Restoring Form Drafts
Forms persist user inputs locally to prevent accidental data loss:
*   **Step-by-Step Persistence**: Forms dynamically capture inputs in steps 1 and 2 and save drafts in `localStorage` (`report_lost_draft` and `report_found_draft`).
*   **Draft Cleansing Guardrail**: Drafts are explicitly cleared *only* after a successful `201 Created` server response is returned, ensuring resilient client state handling.

---

## 📁 Codebase Architecture

```text
Lost & Found Portal
├── api/
│   └── index.js              # Vercel serverless function bridging to Express
├── public/
│   └── favicon.svg           # Premium custom slate navy and gold brand icon
├── server/
│   ├── config/
│   │   ├── cloudinary.js     # Lazy-initialized Cloudinary multer storage
│   │   └── mailer.js         # Security-masked Nodemailer system
│   ├── database/
│   │   └── db.js             # Mongoose connection layer
│   ├── models/
│   │   ├── Claim.js          # Mongoose claims schema
│   │   ├── FoundItem.js      # Compound text indexed FoundItem schema
│   │   ├── LostItem.js       # Compound text indexed LostItem schema
│   │   ├── Match.js          # Automatic items recommendations schema
│   │   └── User.js           # Roles, ban states, and password hashing
│   ├── routes/               # Clean controllers separating core queries
│   └── server.js             # Express startup file with conditional listening
├── src/
│   ├── components/           # Reusable glassmorphic UI components
│   ├── context/              # Authentication states and session storage
│   ├── pages/                # Pages and Right-Drawer layouts
│   ├── utils/
│   │   └── api.js            # Axios utility with auto-interceptors
│   └── vite.config.ts        # Vite setup with local development proxying
├── vercel.json               # Serverless environment deployment routing
└── package.json              # Monorepo setup with unified production dependencies
```

---

## 🛠️ Installation & Local Setup

### 1. Prerequisite Dependencies
Ensure you have **Node.js (v18+)** and **MongoDB** installed on your local machine.

### 2. Install Packages
Run the unified monorepo script in the root directory to install both root, frontend, and backend packages:
```bash
npm run install:all
```

### 3. Environment Variable Configurations
Create a `.env` file in the **root** folder (and `server/` directory for local developer tasks) containing:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Cloudinary (Persistent Cloud Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Domain Validation
UNIVERSITY_DOMAIN=nu.edu.pk
```

### 4. Running the Dev Servers Concurrently
Start the Express server and Vite development environment with a single, concurrent execution:
```bash
npm run dev:all
```
*   **Frontend Client**: `http://localhost:5173` (All requests to `/api` and `/uploads` are automatically proxied to the Express backend).
*   **Backend Server API**: `http://localhost:5000`

---

## ☁️ Deploy Readiness on Vercel

The portal is designed for seamless, one-click deployments onto Vercel:

### How it Works:
1.  **Vite Build**: Vercel runs `npm run build` using the `@vercel/static-build` builder, compiling clean React assets into `dist/`.
2.  **Serverless Routing**: The `vercel.json` configuration maps all backend `/api/(.*)` requests directly to our root-level `api/index.js` serverless function.
3.  **Client-Side Navigation**: Fully supports HTML5 history navigation fallback (`/*` mapped to `/index.html`), preventing broken routes when refreshing SPA pages.
4.  **Ephesian Storage**: Image uploads automatically route to Cloudinary, ensuring complete file durability across ephemeral serverless containers.

### Deployment Instructions:
1.  Connect your repository to the **Vercel Dashboard**.
2.  Set the **Framework Preset** to `Vite`.
3.  Ensure the **Build Command** is `npm run build` and **Output Directory** is `dist`.
4.  Add your production environment variables (MongoDB connection string, JWT secrets, Cloudinary credentials) in the Vercel project settings.
5.  Click **Deploy**!

---

## 🛡️ License

This project is licensed under the terms of the MIT License.
