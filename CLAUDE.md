# UAE (United Arab Emirates) Dashboard (ask-uae)

Korean investor-focused UAE market intelligence platform with AI-powered Q&A.

- **Deploy**: https://askuae.vercel.app
- **Repo**: https://github.com/sj-build/ask-uae.git
- **Telegram Bot**: @askuae_bot

## Identity

- Role: Developer on the ask-uae platform (UAE market intelligence for Korean investors)
- Tone: Precise and professional
- Preserve bilingual (Korean/English) patterns and the multi-agent architecture
- Prioritize data accuracy and real-time responsiveness — this tool supports investment decisions

## Tech Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4, Lucide React icons
- Supabase (PostgreSQL + pgvector for **RAG (Retrieval-Augmented Generation)**)
- Anthropic Claude Sonnet 4 (streaming)
- Google Search API, Keepa API (Amazon UAE)
- Vercel (Hobby tier)

## Agents

### 1. UAE Public Agent (Ask Me)

**Purpose**: RAG + web search 기반 UAE 시장 Q&A
**Entry**: `src/app/api/search/route.ts`
**UI**: `src/components/home/` (Hero + SearchModal)

Pipeline:
1. Zod input validation (query + conversation history)
2. Parallel context building:
   - Vector search (pgvector, threshold 0.65, top 8)
   - Keyword fallback search on `documents` table
   - Google Search runs for real-time data (SHOULD run unless the query is purely about static reference data)
   - Keepa API (triggered on product/brand queries)
3. System prompt injection with UAE reference data (`src/data/`)
4. Claude Sonnet 4 streaming response (max 4096 tokens)
5. Save Q&A to `askme_sessions` + `documents` for knowledge accumulation

Key features:
- Multi-turn conversation (max 8 turns, 15K chars context)
- Auto language detection (Korean/English)
- K-beauty brand detection triggers e-commerce context
- HTML response format: TL;DR + key takeaways + detailed + sources

### 2. Telegram Agent

**Purpose**: Telegram 전용 UAE Q&A 봇
**Entry**: `src/app/api/telegram/webhook/route.ts`
**Logic**: `src/lib/telegram/handler.ts`

- Same Claude backend, Telegram-optimized output
- HTML tags: `<b>`, `<i>`, `<code>`, `<pre>`, `<u>`, `<s>` only
- Per-user session management in Supabase
- Commands: `/start`, `/help`, `/clear`, `/ko`, `/en`
- Rate limiting + allowed chat ID authorization
- Max 2048 tokens per response

### 3. News Agent

**Purpose**: UAE/K-beauty 뉴스 자동 수집
**Entry**: `src/app/api/memory/sync-news/route.ts`
**Schedule**: Daily 9 AM (Vercel Cron)

- Naver News API + Google **RSS (Really Simple Syndication)** crawling
- Keyword packs: UAE politics, economy, K-beauty, K-Wave
- Deduplication by content hash
- Category tagging: politics, economy, society, technology, culture, investment, real-estate
- Saves to `news_articles` table

### 4. Eval Agent

**Purpose**: 콘텐츠 팩트체크 및 정확성 검증
**Entry**: `src/app/api/eval/run/route.ts`
**Core Logic**: `src/lib/eval/` (claim-extractor, rules-checker, llm-judge, fix-applier)
**Admin UI**: `src/app/admin/eval/page.tsx`
**Schedule**: Daily (rules check) + Weekly (LLM factcheck) via Vercel Cron

Pipeline:
1. Site snapshot + knowledge snapshot 수집
2. Claim 추출 (structured parsing + LLM extraction)
3. 검증 수행:
   - `daily_rules`: 패턴 기반 빠른 규칙 체크
   - `weekly_factcheck`: Claude LLM 기반 심층 팩트체크 (우선 페이지: economy, legal, politics)
   - `on_demand`: 두 가지 모두 실행
4. Issue 생성 (verdict: supported / needs_update / contradicted / unverifiable)
5. Suggested fix + patch 제안

Key features:
- Claim types: numeric, definition, policy, timeline, comparison
- Source registry 기반 신뢰도 평가 (trust_level 1-5)
- Severity 분류 (high / med / low) + confidence score
- Admin dashboard에서 issue triage, fix approve 가능
- `eval_runs`, `eval_issues` 테이블에 이력 저장

API endpoints:
- `POST /api/eval/run` - Eval 실행 (auth: x-cron-secret)
- `GET /api/eval/run` - 최근 실행 이력 조회
- `GET /api/admin/eval` - Admin 대시보드 데이터
- `POST /api/admin/eval/trigger` - Admin에서 수동 트리거
- `GET /api/admin/eval/issues` - Issue 목록 조회
- `GET /api/cron/eval-daily` - Daily cron 엔트리
- `GET /api/cron/eval-weekly` - Weekly cron 엔트리

## Tools

| Tool | Purpose | Entry |
|------|---------|-------|
| Anthropic SDK | Claude Sonnet 4 streaming responses | `src/lib/anthropic.ts` |
| Supabase Client | Database operations, vector search, session management | `src/lib/db.ts` |
| OpenAI Embeddings | Generate 1536-dim vectors for RAG | `src/lib/embeddings.ts` |
| Google Search API | Real-time web search for current UAE events | `src/lib/google-search.ts` |
| Keepa API | Amazon UAE product rankings and pricing data | `src/lib/keepa-amazon.ts` |
| Telegram Bot API | Webhook-based chat interface | `src/lib/telegram/handler.ts` |
| Zod | Input validation on all API routes | Used in each `route.ts` |

## Reference Data

Static expertise in `src/data/`:
- `overview/` - 7 Emirates profiles, Korea-UAE relations, government initiatives
- `power/` - Power hierarchy (Tier 1-4), key people, **SWF (Sovereign Wealth Fund)** profiles: **ADIA (Abu Dhabi Investment Authority)**, Mubadala, **ADQ (Abu Dhabi Developmental Holding)**
- `industry/` - 10+ sectors: finance, energy, AI/tech, defense, tourism, e-commerce, real estate, healthcare, logistics, crypto
- `society/` - K-Wave, business culture (wasta, majlis), Ramadan protocols
- `comparison/` - Korea vs UAE (legal, visa, business setup)

## Database (Supabase)

| Table | Purpose |
|-------|---------|
| `documents` | Knowledge base (RAG source) |
| `embeddings` | pgvector (1536-dim, OpenAI) |
| `askme_sessions` | Q&A conversation logs |
| `news_articles` | Crawled news headlines |
| `insights` | Synthesized investment insights |
| `question_logs` | Analytics |
| `eval_runs` | Eval 실행 이력 (type, status, summary) |
| `eval_issues` | 팩트체크 이슈 (claim, verdict, severity, suggested fix) |
| `source_registry` | 검증 소스 레지스트리 (trust_level 1-5) |
| `content_snapshots` | 사이트/지식 스냅샷 (eval 비교용) |

## Architecture Rules

### MUST (Critical)

- Set `maxDuration = 55` on all API routes calling external APIs (Vercel serverless limit). Ask the user before changing this value.
- Always `await` async work — Vercel terminates the process after response. Exception: explicitly building a background job with an external queue.
- Do not self-reference HTTP calls within Vercel functions (causes timeout chains) — call APIs directly. Exception: external webhook triggers from Cron.
- Validate all inputs with Zod schemas before processing any API route, unless prototyping a quick test endpoint.
- Quote `"references"` in PostgreSQL queries — it is a reserved keyword. This applies to any query touching that column.

### SHOULD (Standard)

- SHOULD use only allowed Telegram HTML tags (`<b>`, `<i>`, `<code>`, `<pre>`, `<u>`, `<s>`) + emojis in bot responses
- SHOULD preserve bilingual (Korean/English) patterns in UI and responses
- SHOULD save all Q&A pairs to knowledge base for RAG improvement

### MAY (Nice to Have)

- MAY add new reference data files in `src/data/` for additional UAE sectors
- MAY extend Keepa integration to cover more Amazon categories

## Boundaries

- Do not modify or delete Supabase migration files — ask the user first
- Do not change the system prompt (`src/lib/search-prompt.ts`) without user approval, as it directly affects answer quality
- Do not expose API keys, Telegram tokens, or Supabase service role keys in client-side code or logs
- Do not bypass Zod validation or rate limiting for convenience
- Do not push to production (Vercel) without user confirmation

## Project Structure

```
src/
  app/
    api/
      search/route.ts          # UAE Public Agent
      telegram/webhook/         # Telegram Agent
      memory/sync-news/         # News Agent
      memory/synthesize-insights/ # Insight synthesis (cron)
      eval/run/                 # Eval Agent entry
      cron/                     # Scheduled jobs (incl. eval-daily, eval-weekly)
    admin/                      # Admin panels
    (dashboard)/                # Public dashboard pages
  components/
    home/                       # Ask Me Hero UI
    layout/                     # SearchModal, navigation
    overview/                   # Dashboard sections
    power/                      # Power structure visualizations
  lib/
    anthropic.ts                # Claude API client
    search-prompt.ts            # System prompt builder
    db.ts                       # Database operations + RAG
    embeddings.ts               # Vector embedding generation
    telegram/handler.ts         # Telegram bot logic
    google-search.ts            # Web search integration
    keepa-amazon.ts             # Amazon UAE product data
    eval/                       # Eval Agent core (claim-extractor, rules-checker, llm-judge, fix-applier)
  data/                         # Static UAE expertise data
supabase/                       # Migrations & config
```

## Environment Variables

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_ALLOWED_CHAT_IDS     # Numeric IDs, comma-separated
GOOGLE_SEARCH_API_KEY
KEEPA_API_KEY
OPENAI_API_KEY                 # For embeddings only
CRON_SECRET
```
