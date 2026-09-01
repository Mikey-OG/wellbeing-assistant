# Wellbeing Assistant

A full-stack AI wellbeing assistant built as part of an MSc Data Science dissertation at Loughborough University (2026).

## What it does

Users chat with an AI assistant about their wellbeing concerns. The system figures out what category the concern falls into (sleep, stress, mood, physical health, motivation, or general), pulls relevant information from an NHS knowledge base, and automatically generates a personalised step-by-step plan. Users can check in daily and track their mood over time on a dashboard.


## Tech stack

- Next.js 16 and TypeScript
- Claude Haiku API model
- Cohere for embeddings 
- Pinecone vector database
- Supabase which handles the database and authentication.
- Railway (deployment)

The application is accessible at www

Or Clone the repo and install dependencies:

```bash
git clone https://github.com/Mikey-OG/wellbeing-assistant.git
cd wellbeing-assistant
npm install
```

Create a `.env.local` file with your API keys for these:
ANTHROPIC_API_KEY=
COHERE_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=wellbeing-assistant
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=


Run locally:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.