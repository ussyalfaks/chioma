#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "🔍 Running Backend CI/CD Pipeline Checks..."
echo ""

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Function to run a check
run_check() {
  local name=$1
  local command=$2
  
  echo -e "${BLUE}→ ${name}...${NC}"
  if eval "$command"; then
    echo -e "${GREEN}✓ ${name} passed${NC}"
    echo ""
  else
    echo -e "${RED}✗ ${name} failed${NC}"
    echo ""
    FAILED=$((FAILED + 1))
  fi
}

# 1. Install dependencies
run_check "Installing dependencies" "pnpm install --frozen-lockfile"

# 2. Format check
run_check "Checking code formatting" "npx prettier --check 'src/**/*.ts' 'test/**/*.ts'"

# 3. Linting
run_check "Running ESLint" "pnpm run lint"

# 4. Type checking
run_check "Running TypeScript type checking" "npx tsc --noEmit"

# 5. Unit tests
run_check "Running unit tests" "pnpm run test --ci --forceExit"

# 6. Build
run_check "Building application" "pnpm run build"

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed successfully!${NC}"
  echo "═══════════════════════════════════════════════════════════"
  exit 0
else
  echo -e "${RED}✗ ${FAILED} check(s) failed${NC}"
  echo "═══════════════════════════════════════════════════════════"
  exit 1
fi
