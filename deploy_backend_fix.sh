#!/bin/bash
cd /opt/osmech/backend

# Build
mvn clean package -DskipTests -q -e

if [ -f target/backend-0.0.1-SNAPSHOT.jar ]; then
    echo "✅ Build successful!"
    
    # Stop backend
    cd /opt/osmech
    docker compose -f docker-compose.prod.yml down backend
    
    # Redeploy
    docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backend
    
    # Wait for health check
    echo "Waiting for backend to start..."
    for i in {1..30}; do
        if docker exec osmech-backend curl -s http://localhost:8080/api/actuator/health > /dev/null 2>&1; then
            echo "✅ Backend is healthy!"
            break
        fi
        echo "Waiting... ($i/30)"
        sleep 2
    done
else
    echo "❌ Build failed!"
    exit 1
fi
