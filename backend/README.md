# Backend: F1 Race Intelligence Dashboard

The Spring Boot service that ingests Formula 1 data from OpenF1, normalizes it, and stores it in Supabase (PostgreSQL). The frontend reads the stored data from Supabase; this service keeps it fresh.

**Stack:** Java, Spring Boot, Spring Data JPA, PostgreSQL, Lombok

## 🔄 What it does

1. Fetches the season calendar, session results, standings, and lap data from [OpenF1](https://openf1.org/).
2. Normalizes and writes it to PostgreSQL, one meeting at a time.
3. Runs on demand: an external cron job calls the trigger endpoint during race weekends.

### Sync pipeline

Each sync runs these steps in order:

| Step               | Result                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| Calendar & results | Race weekends and session classifications                                        |
| Driver identities  | Names, teams, and colours for every driver number, including substitutes         |
| Driver standings   | Championship positions and points                                                |
| Team standings     | Constructor positions and points                                                 |
| Laps               | Lap data for the current weekend's non-practice sessions; stale laps are evicted |

A failed step is logged and leaves existing records untouched, so a partial OpenF1 outage never wipes the database.

### Driver identities

OpenF1's "current drivers" list only covers the latest session, so a substitute who raced earlier would show up as "Driver 31" with an unknown team. The backend keeps a `driver_identity` table that is never deleted from: every standings sync saves the real drivers, and for any unknown number found in stored race results it fetches that race's driver list and fills in the name, team, and colour.

## 🔌 Endpoints

| Method | Path                                       | Purpose                                                             |
| ------ | ------------------------------------------ | ------------------------------------------------------------------- |
| `GET`  | `/api/health`                              | Health check                                                        |
| `POST` | `/api/v1/automation/trigger`               | Start the sync pipeline (requires the secret token)                 |
| `POST` | `/api/v1/automation/backfill/{meetingKey}` | Backfill one meeting's results and laps (requires the secret token) |
| `GET`  | `/api/dev/force-sync`                      | Manual sync for local development                                   |

The two automation endpoints expect `{"token": "..."}` in the request body, compared in constant time against `CRON_SECRET_TOKEN`. If the variable isn't set, they refuse every request.

## 🗄️ Data Model

JPA entities (tables are created automatically on startup): race weekends and sessions, race results (classification, grid, pit stops, stints, race control, weather), laps, driver and team standings, and driver identities.

## 💻 Local Development

### Prerequisites

- Java and Maven (or use the included Maven Wrapper)
- Supabase project credentials

### Setup

1. Set the environment variables:
    ```env
    SUPABASE_URL=your_db_url
    SUPABASE_USERNAME=your_username
    SUPABASE_PASSWORD=your_password
    SPRING_PROFILES_ACTIVE=dev
    CRON_SECRET_TOKEN=choose_a_secret
    ```
2. Start the server:
    ```bash
    ./mvnw spring-boot:run
    ```
    It runs on port `8080`.

## ⚙️ Hosting & Constraints

- **Render free tier:** the service spins down when idle, so the first request after a quiet period takes about 5-10 seconds. Background workers aren't reliable there, so [cron-job.org](https://cron-job.org/) calls the trigger endpoint during race-weekend windows instead.
- **OpenF1 rate limits:** requests are spaced out and OpenF1 responses are cached briefly in memory. During live sessions OpenF1 can restrict historical requests, which is why data is persisted and served from the database.
