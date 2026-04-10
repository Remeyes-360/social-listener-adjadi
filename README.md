# 📡 Social Media Listener — Olushegun ADJADI BAKARI

Real-time social media monitoring dashboard powered by **Claude AI** and **Tavily Search**.

## Features

- 🔍 Monitors mentions of **Olushegun ADJADI BAKARI** across Twitter/X, Instagram, Facebook, LinkedIn, TikTok
- 🤖 AI-powered analysis by Claude: sentiment, context, importance, summary
- 📊 Live stats: charts by platform, sentiment breakdown, timeline
- 🔴 Critical mention alerts with visual pulse indicators
- ⏱️ Auto-refresh every 60 seconds + manual refresh
- 📤 JSON export of all analyzed mentions
- 🌙 Dark mode professional UI

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Recharts** for visualizations
- **Anthropic Claude API** (`claude-sonnet-4-20250514`) for analysis
- **Tavily Search API** for real-time web/social search
- Deployed on **Vercel**

## Setup

1. Clone and install:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Fill in your API keys
```

3. Run locally:
```bash
npm run dev
```

## Environment Variables (required in Vercel)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `TAVILY_API_KEY` | Your Tavily Search API key |
| `NEXT_PUBLIC_SUBJECT_NAME` | Subject name (default: "Olushegun ADJADI BAKARI") |

## API Routes

- `GET /api/mentions` — Fetches raw mentions from all platforms via Tavily
- `POST /api/analyze` — Sends mentions to Claude for analysis

## Known Limitations

- **Instagram, Facebook, TikTok**: These platforms actively restrict public scraping. Tavily may return limited or no results for these. The app handles this gracefully.
- **Twitter/X**: Public tweets are indexed by search engines and generally return better results.
- **LinkedIn**: Professional posts are partially indexed.
- Rate limits apply to both Tavily (search) and Anthropic (analysis) APIs.
