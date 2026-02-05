#!/usr/bin/env python3
import re

with open('/root/ii-agent/docker/docker-compose.stack.yaml') as f:
    content = f.read()

# Replace postgres port mapping to avoid conflict
content = re.sub(r'"\${POSTGRES_PORT:-5432}:5432"', '"5433:5432"', content)

# Replace redis port mapping to avoid conflict
content = re.sub(r'"\${REDIS_PORT:-6379}:6379"', '"6380:6379"', content)

with open('/root/ii-agent/docker/docker-compose.stack.yaml', 'w') as f:
    f.write(content)

print('Port mappings updated: postgres=5433, redis=6380')
