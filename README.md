# 📡 Social Media Listener — Olushegun ADJADI BAKARI   

Real-time social media monitoring dashboard powered by **Social listening** (Perplexity AI).

## Features

- 🔍 Monitors mentions of **Olushegun ADJADI BAKARI** across Twitter/X, Instagram, Facebook, LinkedIn, TikTok
- 🤖 AI-powered analysis by **Social listening**: sentiment, context, importance, summary
- 📊 Live stats: charts by platform, sentiment breakdown, timeline
- 🔴 Critical mention alerts with visual pulse indicators
- ⚡ Auto-refresh every 1 hour + manual refresh
- <!-- deploy -->
- 📦 JSON export of all analyzed mentions
- 🌙 Dark mode professional UI
- 📅 Mentions triées du plus récent au plus ancien

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Recharts** for visualizations
- **Perplexity AI API** (`llama-3.1-sonar-small-128k-online`) for Social listening analysis
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
