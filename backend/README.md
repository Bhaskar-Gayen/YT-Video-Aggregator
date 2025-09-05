
# 📺 YouTube Video Aggregator

A Node.js + Express + Prisma + BullMQ project that fetches and stores YouTube video data into a PostgreSQL database.  
It supports background workers for recurring jobs, validation with Zod, and a REST API to query stored videos.

---

## 🚀 Features
- Fetch latest YouTube videos by search query.
- Store video metadata & statistics (views, likes, comments) in PostgreSQL.
- Background job processing with **BullMQ** & Redis.
- Input validation using **Zod**.
- REST API with pagination, filtering, and sorting.

---

## 🛠️ Tech Stack
- **Node.js** (TypeScript)
- **Express.js**
- **Prisma** (PostgreSQL ORM)
- **BullMQ** (Redis-based job queue)
- **Zod** (validation)
- **pnpm** (package manager)

---

## 📦 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/YTVideoAggregator.git
cd YTVideoAggregator
````

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/youtube"
REDIS_HOST=localhost
REDIS_PORT=6379

# YouTube API keys (comma-separated if multiple)
YOUTUBE_API_KEYS=your_api_key_1,your_api_key_2
YOUTUBE_SEARCH_QUERY=nodejs tutorial
FETCH_INTERVAL_SECONDS=60 # in sec (e.g., 1 minute)
```

### 4. Setup Database

Run Prisma migrations:

```bash
pnpm prisma migrate dev
```

Generate Prisma client:

```bash
pnpm prisma generate
```

---

## ▶️ Running the Project

### Start the API server

```bash
pnpm run dev
```

The server will start at [http://localhost:3000](http://localhost:3000).

### Start the Worker (BullMQ)

```bash
cd backend/
pnpm run start:worker
```

This runs the worker that fetches and stores videos on schedule.

---

## 📡 API Endpoints

### `GET /api/videos`

Query stored videos with filters:

* `page` (default: 1)
* `limit` (default: 20)
* `sortBy` (`publishedAt | title | viewCount`)
* `sortOrder` (`asc | desc`)
* `channelId`
* `dateFrom`
* `dateTo`

Example:

```http
GET http://localhost:3000/api/videos?page=1&limit=10&sortBy=publishedAt&sortOrder=desc
```

Response:

```json
{
  "status": "success",
  "data": {
    "videos": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```


## 🧑‍💻 Development Scripts

* `pnpm run dev` → Start API server in dev mode
* `pnpm run start:worker` → Start background worker
* `pnpm prisma studio` → Open Prisma DB UI


## ✅ Requirements

* Node.js 18+
* PostgreSQL
* Redis
* pnpm


## 📌 Notes

* Ensure Redis and PostgreSQL are running before starting the worker.
* If you hit **YouTube API quota limits**, add multiple API keys in `.env` (`YOUTUBE_API_KEYS`).

