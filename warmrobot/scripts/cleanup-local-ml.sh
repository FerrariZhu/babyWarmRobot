#!/usr/bin/env bash
# Remove locally downloaded ML models and caches (SAM, rembg, Ultralytics).
# Ollama models (~/.ollama) are NOT deleted automatically — see hints below.
#
# Usage: ./scripts/cleanup-local-ml.sh

set -euo pipefail

echo "=== 清理本地 ML 缓存 ==="

remove_if_exists() {
  local path="$1"
  if [[ -e "${path}" ]]; then
    echo "删除: ${path}"
    rm -rf "${path}"
  else
    echo "跳过（不存在）: ${path}"
  fi
}

remove_if_exists "${HOME}/.cache/warmrobot/sam-venv"
remove_if_exists "${HOME}/.cache/warmrobot/models"
remove_if_exists "${HOME}/.cache/ultralytics"
remove_if_exists "${HOME}/.u2net"

if command -v docker >/dev/null 2>&1; then
  if docker volume inspect rembg-models >/dev/null 2>&1; then
    echo "删除 Docker volume: rembg-models"
    docker volume rm rembg-models 2>/dev/null || echo "  （volume 可能仍被容器占用，可先 docker compose down）"
  else
    echo "跳过（不存在）: Docker volume rembg-models"
  fi
fi

if pgrep -f "uvicorn server:app" >/dev/null 2>&1; then
  echo "停止本地 SAM 服务进程..."
  pkill -f "uvicorn server:app" 2>/dev/null || true
fi

echo ""
echo "=== 完成 ==="
echo ""
echo "Ollama 模型未自动删除。如需清理，请手动执行："
echo "  ollama list"
echo "  ollama rm qwen2.5vl:3b   # 或其他已拉取的模型"
echo ""
echo "Ollama 数据目录: ~/.ollama"
