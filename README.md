# 🏎️ F1 Race Intelligence Dashboard

A fullstack F1 analytics platform that visualizes real-time and historical Formula 1 data using OpenF1 API.

## 🌐 Live Demo
https://f1-race-intelligence-dashboard.vercel.app/

## 🚀 Tech Stack

- Frontend: Next.js (React + TypeScript)
- Backend: Spring Boot (Java)
- Database: PostgreSQL
- Data Source: OpenF1 API

## 📊 Features

- Live race position tracking
- Driver performance comparison
- Lap time analysis
- Race session overview
- Interactive dashboards
- Computed standings engine (backend)

## 🧠 Architecture

OpenF1 API → Spring Boot Backend → Next.js Frontend

## 📦 Project Structure

/frontend → Next.js dashboard UI

/backend → Spring Boot API + data processing

## 🎯 Goal

To simulate a real-world motorsport analytics system with backend processing, API design, and interactive frontend visualization.

## 📌 Status

🚧 Phase 1 – Frontend Dashboard UI (✅)

- Interactive F1 dashboard layout
- Driver standings table with live simulation
- Championship battle charts
- Component-based UI architecture

🟡 Phase 2 – Backend Development (✅)
- Spring Boot API setup
- OpenF1 API integration layer
- Data models for drivers, races, standings
- REST endpoints for frontend consumption
- Basic race data processing logic

🔵 Phase 3 – Frontend ↔ Backend Integration 
- Replace mock data with real API calls
- Live data synchronization between backend and UI
- Error handling + loading states
- API service layer in Next.js

## 🧭 Roadmap

🟣 Phase 4 – Advanced Features & Expansion (In Progress)
- Driver profile pages
- Race detail pages
- Telemetry-style visualizations
- Advanced analytics (lap trends, pit strategy insights)
- UI polish for portfolio/demo quality
