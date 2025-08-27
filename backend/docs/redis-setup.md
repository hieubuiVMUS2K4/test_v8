# Redis để cache exam sessions và giảm tải DB

# Cài đặt Redis client

npm install redis

# Environment variables thêm vào .env

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache strategies:

# 1. Exam sessions: 2 hours TTL

# 2. User progress: 1 hour TTL

# 3. Question pools: 24 hours TTL

# 4. Topic metadata: 6 hours TTL
