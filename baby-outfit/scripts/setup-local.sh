#!/usr/bin/env bash
# babywarmrobot 本地一键部署脚本
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> babywarmrobot 本地部署"
echo "    项目目录: $ROOT"
echo ""

# --- 前置检查 ---
need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "错误: 未找到 $1。$2"
    exit 1
  fi
}

need_cmd node "请安装 Node.js 18+：https://nodejs.org/"
need_cmd npm "请安装 npm（通常随 Node.js 一起安装）"
need_cmd docker "请安装并启动 Docker Desktop：https://docs.docker.com/get-docker/"

if ! docker info >/dev/null 2>&1; then
  echo "错误: Docker 未运行。请先启动 Docker Desktop，然后重试。"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "错误: 需要 Node.js 18+，当前版本: $(node -v)"
  exit 1
fi

# --- 安装 Supabase CLI（如未安装）---
install_supabase_cli() {
  echo "==> 安装 Supabase CLI..."
  OS=$(uname -s)
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) ARCH=amd64 ;;
    aarch64|arm64) ARCH=arm64 ;;
    *) echo "错误: 不支持的架构 $ARCH"; exit 1 ;;
  esac

  if [ "$OS" = "Darwin" ]; then
    if command -v brew >/dev/null 2>&1; then
      brew install supabase/tap/supabase
      return
    fi
    echo "macOS 请先安装 Homebrew，或手动安装 Supabase CLI"
    exit 1
  fi

  SUPABASE_DIR="${HOME}/.local/share/supabase"
  mkdir -p "$SUPABASE_DIR"
  VERSION="2.102.0"
  curl -fsSL "https://github.com/supabase/cli/releases/download/v${VERSION}/supabase_${VERSION}_linux_${ARCH}.tar.gz" \
    | tar -xzf - -C "$SUPABASE_DIR"
  export PATH="$SUPABASE_DIR:$PATH"
  echo "    已安装到 $SUPABASE_DIR（建议加入 ~/.bashrc: export PATH=\"\$HOME/.local/share/supabase:\$PATH\"）"
}

if ! command -v supabase >/dev/null 2>&1; then
  install_supabase_cli
fi

# --- 安装依赖 ---
echo "==> 安装 npm 依赖..."
npm install

# --- 启动 Supabase ---
echo "==> 启动本地 Supabase（首次运行会下载 Docker 镜像，可能需要几分钟）..."
supabase start

echo "==> 应用数据库 migration 与 demo 数据..."
supabase db reset

# --- 写入环境变量 ---
echo "==> 生成 web/.env.local ..."
ENV_FILE="$ROOT/web/.env.local"
eval "$(supabase status -o env 2>/dev/null | grep -E '^(ANON_KEY|API_URL)=' || true)"

if [ -z "${ANON_KEY:-}" ]; then
  echo "错误: 无法从 supabase status 获取 ANON_KEY"
  exit 1
fi

cat > "$ENV_FILE" <<EOF
# 由 scripts/setup-local.sh 自动生成 — 本地 Supabase
NEXT_PUBLIC_SUPABASE_URL=${API_URL:-http://127.0.0.1:54321}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
EOF

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "  启动开发服务器:"
echo "    cd baby-outfit && npm run dev"
echo ""
echo "  访问: http://localhost:3000"
echo ""
echo "  Demo 登录账号:"
echo "    邮箱: demo_user_1@baby-outfit.dev"
echo "    密码: password123"
echo ""
echo "  Supabase Studio: http://127.0.0.1:54323"
echo ""
supabase status
