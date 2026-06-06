# 🏎️ F1 Race Intelligence Dashboard

A full-stack F1 analytics platform that visualizes real-time and historical Formula 1 data using the OpenF1 API.

## 🌐 Live Demo
[f1-race-intelligence-dashboard.vercel.app](https://f1-race-intelligence-dashboard.vercel.app/)

## 🚀 Tech Stack

* **Frontend**: Next.js (React, TypeScript, Tailwind CSS, Shadcn UI, Recharts)
* **Backend**: Spring Boot (Java, Spring Web)
* **Data Source**: OpenF1 API

## 📊 Features

* **Live Telemetry & Tracking**: Real-time driver position and interval tracking.
* **Performance Analytics**: Comparative driver lap-time and stint analysis.
* **Standings Engine**: Backend-computed driver and constructor championship standings.
* **Interactive Data Visualization**: Dynamic charts for lap trends and championship battles.

## 🧠 Architecture & Data Flow

![Architecture & Data Flow](images/architecture.png)

* **Ingestion Layer**: Spring Boot services poll, process, and memory-cache data from the OpenF1 API.
* **Processing Engine**: Backend calculates running statistics, session gaps, and standings on the fly.
* **Presentation Layer**: Next.js consumes polished endpoints to render responsive, low-latency dashboards.

## 📦 Project Structure

* `/frontend`: Next.js dashboard application, UI components, and API service layer.
* `/backend`: Spring Boot application, data models, processing logic, and REST controllers.

## 🗺️ Roadmap & Status

* **✅ Phase 1: Frontend Dashboard UI** – Component architecture, mock data simulation, and responsive layout.
* **✅ Phase 2: Backend Development** – OpenF1 integration, in-memory data processing, and REST endpoints.
* **✅ Phase 3: Full-Stack Integration** – Connected Next.js to Spring Boot, added state management, and handled loading states.
* **🔄 Phase 4: Advanced Features (In Progress)** – Driver profile pages, telemetry visualizations, and pit strategy insights.

<details>
<summary>⚙️ <b>Local Development Setup</b> (Click to expand)</summary>

### Backend Setup
1. Navigate to `/backend`
2. Run `./mvnw spring-boot:run` to start the server on port `8080`

### Frontend Setup
1. Navigate to `/frontend`
2. Create a `.env.local` file and set `NEXT_PUBLIC_API_URL=http://localhost:8080`
3. Run `npm install` followed by `npm run dev`
</details>

<details>
<summary>⚠️ <b>System Constraints & Resiliency</b> (Click to expand)</summary>

### 🛰️ Upstream API Access (OpenF1)
* **Behavior**: During live Formula 1 race sessions, the public OpenF1 API rate-limits historical queries and restricts unauthenticated global access.
* **Mitigation**: The backend features robust error handling to gracefully degrade UI components with appropriate warning states when live session locks are active.

### 🐢 Infrastructure Latency (Free-Tier Hosting)
* **Backend Cold Starts**: Hosted on Render's free tier. Inactivity triggers a spun-down container state. The initial API request may encounter a **5–10 second delay** while the service wakes up.
* **Frontend Performance**: Hosted on Vercel. Global delivery is highly optimized, though data-dependent components rely on the backend wake-up cycle.
</details>