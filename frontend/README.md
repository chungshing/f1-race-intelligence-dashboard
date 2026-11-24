# Frontend: F1 Race Intelligence Dashboard

The Next.js application: dashboard UI, server-side API routes, and the AI race analyst.

**Stack:** Next.js, React, TypeScript, Tailwind CSS, Shadcn UI, Recharts, TanStack Query, d3-geo, react-markdown

## ✨ Features

### Race Weekend & Session Analysis

- Interactive race replay for exploring recorded race progression
- Session results and classification, including Sprint and Grand Prix sessions
- Weather conditions and race-control events
- Official starting grid, qualifying positions, and finishing positions, accounting for penalties
- Position-by-lap charts with safety car periods highlighted
- **Circuit History tab:** past winners, most successful drivers and teams, and where winners started on the grid

### Season Calendar

- **Interactive season map:** every venue on a world map with a route line in race order, zoom-to-venue so clustered circuits stay readable, and previous/next controls
- Selected-race panel with the full session schedule
- **Per-session weather forecast** for the upcoming race weekend ([Open-Meteo](https://open-meteo.com/))
- Add race weekends to your calendar as an `.ics` file

### Strategy & Performance

- Tyre stint and pit stop analysis
- **Tyre degradation curves** for every compound, including intermediates and wets, measured against the field's pace on the same lap so fuel burn and track evolution cancel out
- Pit stop leaderboard and team pit crew rankings by median stop time
- Lap time heatmaps, pace charts, sector times, and speed analysis

### Drivers, Constructors & Championships

- Last Race recap: podium, biggest grid-to-race gainer, fastest pit stop
- Driver and constructor profile pages
- **Career statistics** (titles, wins, poles, podiums, starts) on profiles and in comparisons ([Jolpica](https://github.com/jolpica/jolpica-f1))
- Head-to-head **driver** and **constructor** comparisons
- Season form, points progression, standings, and a title-fight calculator

### Progressive Web App

- Installable, standalone display mode with app icons
- Service worker caches the app shell and static assets
- React Query persists fetched data in IndexedDB, so previously loaded views work offline
- Cache is versioned and invalidated on each production deployment

## 🤖 AI Race Analyst

A floating chat assistant on every page. It's an agent, not a general chatbot: for each question Gemini picks which tools to call, the server runs them against the dashboard's data, and the model answers only from the results.

| Tool                  | What it answers                                                                         |
| --------------------- | --------------------------------------------------------------------------------------- |
| `list_races`          | The season calendar                                                                     |
| `get_standings`       | Driver and constructor championships                                                    |
| `get_session_results` | Classification, grid, places gained, pit stops, stints, safety cars, penalties, weather |
| `get_race_story`      | Lap-by-lap analysis: position per lap, per-stint pace against the winner                |
| `get_driver_season`   | A driver's result in every session of the season                                        |
| `get_team_season`     | A team's points, wins, DNFs, pit stop speed, round-by-round results                     |
| `get_circuit_history` | Past winners, most successful drivers and teams, winning grid positions                 |
| `get_driver_career`   | Titles, wins, poles, podiums, race starts                                               |
| `get_race_forecast`   | Weather forecast for the upcoming race weekend                                          |

**Design notes**

- Runs in `/api/ask`, so the Gemini key never reaches the browser.
- Grounded by instruction: tool data only, and "the data can't answer that" when it can't. It doesn't answer general F1 questions.
- Questions like "why didn't X win?" are explained in order: grid position, stint pace, pit stops, safety cars, position changes.
- The tool loop is capped at a few steps per question, and requests are rate-limited per IP.
- Replies render as markdown (bold figures, bullet points, tables).

## 🔌 Server-side Routes

| Route                                    | Purpose                                                      |
| ---------------------------------------- | ------------------------------------------------------------ |
| `/api/ask`                               | AI analyst: Gemini tool-calling loop                         |
| `/api/history/driver`                    | Career totals from Jolpica, cached for 24 hours              |
| `/api/history/circuit`                   | Circuit history from Jolpica, cached for 24 hours            |
| `/api/sync`, `/api/backfill`, `/admin/*` | Admin tools, protected by `ADMIN_PASSWORD` (HTTP Basic auth) |

## 💻 Local Development

### Prerequisites

- Node.js and npm
- A Supabase project with data loaded by the [backend](../backend/README.md)
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (free tier) for the AI analyst

### Setup

1. Create `.env.local`:

    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

    # AI Race Analyst
    GEMINI_API_KEY=your_gemini_key
    # GEMINI_MODEL=gemini-flash-lite-latest   (optional override)

    # Protects /admin and the sync/backfill routes
    ADMIN_PASSWORD=choose_a_password
    ```

2. Install and run:
    ```bash
    npm install
    npm run dev
    ```

Jolpica and Open-Meteo need no keys.

## ⚙️ Constraints

- **Jolpica** enforces a low request rate, so history routes call it sequentially and cache each response for 24 hours.
- **Open-Meteo** forecasts reach about 15 days ahead, so the forecast appears once the weekend is inside that window.
- **Gemini free tier** has its own quota. If it runs out, the chat shows a short "try again shortly" message.
- **Backend cold starts** (Render free tier) can delay the first request by 5-10 seconds.
