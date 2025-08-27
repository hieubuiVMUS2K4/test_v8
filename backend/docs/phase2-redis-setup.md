# Phase 2: Redis Integration Setup

## Bước 1: Cài đặt Redis

```bash
# Cài đặt Redis client cho Node.js
cd backend
npm install redis

# Thêm vào package.json dependencies
```

## Bước 2: Environment Variables

Thêm vào file `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL_EXAM_SESSION=7200    # 2 hours
REDIS_TTL_USER_PROGRESS=3600   # 1 hour
REDIS_TTL_QUESTION_POOL=86400  # 24 hours
```

## Bước 3: Redis Installation với Docker

### Option 1: Docker Simple (Recommended)

```bash
# Pull Redis image
docker pull redis:latest

# Run Redis container
docker run --name exam-redis -p 6379:6379 -d redis:latest

# Test connection
docker exec -it exam-redis redis-cli ping
# Expected: PONG
```

### Option 2: Docker với persistent data

```bash
# Tạo volume để lưu data Redis
docker volume create redis-data

# Run Redis với volume
docker run --name exam-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  -d redis:latest redis-server --appendonly yes

# Test connection
docker exec -it exam-redis redis-cli ping
```

### Option 3: Docker Compose (Best for production)

Tạo file `docker-compose.yml` trong thư mục backend:

```yaml
version: "3.8"
services:
  redis:
    image: redis:latest
    container_name: exam-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

Chạy với Docker Compose:

```bash
# Start Redis
docker-compose up -d

# Stop Redis
docker-compose down

# View logs
docker-compose logs redis
```

### Quản lý Redis Container

```bash
# Xem container đang chạy
docker ps

# Stop Redis
docker stop exam-redis

# Start Redis
docker start exam-redis

# Remove Redis container
docker rm exam-redis

# Connect to Redis CLI
docker exec -it exam-redis redis-cli

# View Redis logs
docker logs exam-redis
```

### Alternative: Windows Native Installation

- Download từ: https://github.com/microsoftarchive/redis/releases

## Bước 4: Test Redis Connection và Performance

### Test Basic Connection

```bash
# Method 1: Sử dụng Docker CLI
docker exec -it exam-redis redis-cli ping
# Expected: PONG

# Method 2: Sử dụng Redis CLI native (nếu cài đặt)
redis-cli ping
# Expected: PONG

# Method 3: Test từ Node.js application
cd backend
node -e "
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});
client.on('connect', () => console.log('✅ Redis connected successfully!'));
client.on('error', (err) => console.log('❌ Redis connection error:', err));
"
node -e "const redis = require('redis'); const client = redis.createClient({ host: 'localhost', port: 6379 }); client.on('connect', () => console.log('✅ Redis connected successfully!')); client.on('error', (err) => console.log('❌ Redis connection error:', err));"
```

### Test Performance và Monitoring

```bash
# Monitor Redis performance
docker exec -it exam-redis redis-cli monitor

# Check Redis info
docker exec -it exam-redis redis-cli info

# Check memory usage
docker exec -it exam-redis redis-cli info memory

# Test set/get operations
docker exec -it exam-redis redis-cli
> SET test-key "Hello Redis"
> GET test-key
> DEL test-key
> exit
```
