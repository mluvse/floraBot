#!/bin/bash
# FloraBot Quick Start Script
set -e

echo "🌸 FloraBot — Quick Start"
echo "=========================="

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker не установлен. Установите Docker и Docker Compose."
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
  echo "❌ Docker Compose не установлен."
  exit 1
fi

# Create .env if missing
if [ ! -f .env ]; then
  echo "📋 Создаём .env из .env.example..."
  cp .env.example .env
  echo "⚠️  Заполните .env своими значениями (Yandex API key, JWT secret)"
fi

echo ""
echo "🚀 Запускаем FloraBot..."
docker-compose up --build -d

echo ""
echo "✅ FloraBot запущен!"
echo ""
echo "  🌐 Приложение:  http://localhost"
echo "  🔌 API:         http://localhost:5000/api"
echo "  💚 Health:      http://localhost:5000/api/health"
echo ""
echo "Логи: docker-compose logs -f"
echo "Стоп: docker-compose down"
