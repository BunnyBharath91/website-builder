# AI Website Builder

A powerful, AI-driven platform that allows users to create and refine websites using natural language prompts. Built with a modern full-stack architecture, it features real-time AI revisions, version control, and a community showcase.

## 🚀 Features

- **AI-Powered Revisions**: Describe the changes you want in plain English, and the AI will enhance your prompt and update the website code instantly using Tailwind CSS.
- **Version Control**: Automatically saves versions of your project. Roll back to any previous state with a single click.
- **Interactive Preview**: Real-time preview of your generated websites.
- **Community Showcase**: Discover and explore websites built by other users in the community.
- **Credits System**: Integrated credit-based system for AI operations, powered by Stripe.
- **Secure Authentication**: Robust user authentication and session management using Better Auth.
- **Responsive Design**: Built with Tailwind CSS 4 to ensure all generated sites and the platform itself look great on any device.

## 🛠️ Tech Stack

### Frontend

- **React 19**: Modern UI library for building interactive interfaces.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS 4**: The latest utility-first CSS framework for styling.
- **React Router 7**: For seamless client-side navigation.
- **Lucide React**: Beautifully simple pixel-perfect icons.
- **Sonner**: Sleek toast notifications for user feedback.

### Backend

- **Express 5**: Fast, unopinionated, minimalist web framework for Node.js.
- **Prisma**: Next-generation ORM for Type-safe database access.
- **PostgreSQL**: Reliable and powerful relational database.
- **OpenAI / OpenRouter**: Powers the AI revision and code generation engine. OpenAI is the primary provider; OpenRouter is used automatically as a fallback when OpenAI returns 429 (rate limit/quota) or 5xx (server) errors.
- **Stripe**: Handles secure payments and credit top-ups.
- **Better Auth**: Comprehensive authentication solution.

## 📦 Project Structure

```text
website_builder/
├── client/             # Vite + React Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application pages (Home, Projects, etc.)
│   │   └── lib/        # Client-side utilities and configurations
├── server/             # Express + Prisma Backend
│   ├── controllers/    # Business logic for routes
│   ├── routes/         # API endpoint definitions
│   ├── prisma/         # Database schema and migrations
│   └── configs/        # Server-side configurations (OpenAI, Stripe)
└── package.json        # Root workspace configuration
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API Key
- Stripe Account (for payments)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd website_builder
   ```

2. **Install dependencies**:

   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client && npm install

   # Install server dependencies
   cd ../server && npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in both `client` and `server` directories based on their respective requirements.

   **Server `.env`:**

   ```env
   DATABASE_URL="postgresql://..."
   BETTER_AUTH_SECRET="your_auth_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   TRUSTED_ORIGINS="http://localhost:5173"

   # AI providers: OpenAI is primary; OpenRouter is used only on 429 or 5xx from OpenAI
   OPENAI_API_KEY="your_openai_key"
   OPENAI_MODEL="gpt-4.1-mini"
   OPENROUTER_API_KEY="your_openrouter_key"
   OPENROUTER_MODEL="stepfun/step-3.5-flash:free"

   STRIPE_SECRET_KEY="your_stripe_key"
   STRIPE_WEBHOOK_SECRET="your_webhook_secret"
   ```

   **Client `.env`:**

   ```env
   VITE_API_URL="http://localhost:3000"
   ```

4. **Database Migration**:
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

### Running the Application

1. **Start the Server**:

   ```bash
   cd server
   npm run server
   ```

2. **Start the Client**:
   ```bash
   cd client
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## � Deployment

This project is configured for easy deployment on **Vercel**.

### Backend

The server is optimized for Vercel Serverless Functions. Ensure you set all environment variables in your Vercel project settings.

### Frontend

The client is a standard Vite application that can be deployed to Vercel, Netlify, or any static hosting provider.
