# 🛡️ Sentinel - Intelligent AML Compliance System

> **Next-Generation Anti-Money Laundering Platform powered by AI and Biometric Verification.**

Sentinel is an enterprise-grade compliance solution designed to detect sophisticated financial crimes in real-time. By combining biometric identity verification with AI-driven transaction monitoring, Sentinel helps financial institutions prevent fraud, money laundering, and regulatory breaches.

![Sentinel Dashboard](./public/hero-screenshot.png)

## 🚀 Key Features

### 🕵️‍♂️ AI-Driven Transaction Monitoring
- **Real-time Fraud Detection**: Analyzes transaction velocity, geolocation, and behavioral patterns.
- **Structuring & Smurfing Detection**: Automatically flags transactions designed to evade reporting thresholds (e.g., amounts just below ₹50,000).
- **Semantical Analysis**: Scans transaction descriptions for high-risk keywords (e.g., "crypto", "urgent", "drug").

### 🆔 Biometric KYC Verification
- **Liveness Detection**: Prevents spoofing attacks using active 3D face verification.
- **OCR Document Extraction**: Automatically extracts and validates data from government IDs (Aadhaar, PAN).
- **Face Matching**: Compares live selfie with ID photo using DeepFace/Face-API.js with >98% accuracy.

### 📊 Compliance Dashboard
- **Risk Scoring**: Assigns dynamic risk scores (0-100) to every user based on activity.
- **Visual Alert Management**: Review prioritized alerts with AI-generated explanations.
- **Audit Trails**: Immutable logs of all compliance actions for regulatory reporting.

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **AI/ML** | Google Gemini 1.5 Pro (Risk Analysis), Face-API.js (Biometrics) |
| **Security** | JWT Authentication, Bcrypt, Input Validation (Zod) |

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/sentinel.git
cd sentinel
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sentinel"
JWT_SECRET="your_secure_jwt_secret"
GEMINI_API_KEY="your_gemini_api_key"
PORT=3000
```

### 4. Run the Application
**Backend Server:**
```bash
cd server
npm run dev
```

**Frontend Application:**
```bash
# In a new terminal
npm run dev
```
Access the application at `http://localhost:5173`.

## 🧪 Testing Compliance Rules

Sentinel comes with pre-configured compliance rules for demonstration and testing purposes.

**Structuring Detection Test:**
1. Log in as a user.
2. Initiate a transfer of exactly **₹49,999**.
3. The system will flag this as "Potential Structuring" (Smurfing Attempt) as it falls just below the configured reporting threshold.

## 📄 License
MIT License.

---
*Built with ❤️ for TechFiesta 2025*