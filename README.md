# Outreach Matcher

Paste a company's About page or a role description. **Cohere Embed v4** scores it
against my real projects and picks the most relevant one to mention. **Cohere
Chat (command-a)** then drafts a cold email or LinkedIn message in my own voice —
automating something I'd been doing by hand for every application.

It uses two parts of Cohere's platform, not just one:

```
company text ──► Embed v4 (search_query)
                      │  cosine similarity
project corpus ─► Embed v4 (search_document)
                      ▼
              best-matched project ──► Chat (command-a) ──► drafted message
```

The project match is shown in the UI with the actual cosine scores, so it's
obvious the selection is semantic, not hardcoded.

## Run it

```bash
npm install
cp .env.example .env.local      # then paste your key into .env.local
npm run dev
```

Get a free trial key at https://dashboard.cohere.com/api-keys.

Deploy to Vercel: push to GitHub, import the repo, set `COHERE_API_KEY` as an
environment variable. No custom domain needed.

## Make it yours

- `lib/projects.ts` — the project corpus that gets embedded and matched.
  **Note:** the RacketSense entry is a placeholder — replace it with the real
  description before showing this off.
- `lib/examples.ts` — my profile, voice rules, and few-shot examples that anchor
  the model to how I actually write. This is what keeps the output from sounding
  like generic AI text.
- `lib/cohere.ts` — model choices (`command-a-03-2025`, `embed-v4.0`).

## Models

- **Chat:** `command-a-03-2025` via `POST /v2/chat`
- **Embed:** `embed-v4.0` via `POST /v2/embed`, `input_type` of `search_query` /
  `search_document` for asymmetric retrieval.

(The older Generate endpoint is deprecated; this uses the current v2 API.)

## Why I built this

I apply to a lot of startups, and the part that actually works is a short message
that (a) sounds like a person and (b) points at the one project most relevant to
what *they* build. I was doing that matching in my head every time. This does the
matching with embeddings and the drafting with a few-shot prompt built from my own
past outreach, so the output is the message I'd have written, faster.

The interesting engineering bit is the asymmetric embedding search: the company
text is embedded as a query and the projects as documents, which is what Embed v4's
`input_type` distinction is for. Cosine similarity over those vectors is what picks
Dice AI for a fintech company vs InterviewRoyale for a consumer one.
