# 📡 Social Media Listener — Olushegun ADJADI BAKARI

Real-time social media monitoring dashboard powered by **Rémi** (Perplexity AI).

## Features

- 🔍 Monitors mentions of **Olushegun ADJADI BAKARI** across Twitter/X, Instagram, Facebook, LinkedIn, TikTok
- 🤖 AI-powered analysis by **Rémi**: sentiment, context, importance, summary
- 📊 Live stats: charts by platform, sentiment breakdown, timeline
- 🔴 Critical mention alerts with visual pulse indicators
- ⚡ Auto-refresh every 60 seconds + manual refresh
- 📦 JSON export of all analyzed mentions
- 🌙 Dark mode professional UI

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Recharts** for visualizations
- **Perplexity AI API** (`llama-3.1-sonar-small-128k-online`) for analysis by Rémi
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

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PERPLEXITY_API_KEY` | Perplexity API key (Rémi engine) |
| `TWITTER_BEARER_TOKEN` | X/Twitter Bearer Token |
| `FACEBOOK_APP_ID` | Meta App ID |
| `FACEBOOK_APP_SECRET` | Meta App Secret |
| `FACEBOOK_ACCESS_TOKEN` | Facebook Access Token |
| `FACEBOOK_PAGE_ID` | Facebook Page ID |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram Access Token |
| `INSTAGRAM_USER_ID` | Instagram User ID |
| `LINKEDIN_CLIENT_ID` | LinkedIn Client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Client Secret |
| `TIKTOK_CLIENT_KEY` | TikTok Client Key |
| `TIKTOK_CLIENT_SECRET` | TikTok Client Secret |

## Live Demo

[social-listener-adjadi-two.vercel.app](https://social-listener-adjadi-two.vercel.app)

---

*Powered by Rémi — v2.0*
