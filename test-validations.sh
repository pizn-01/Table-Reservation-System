#!/bin/bash

# Table Reservation System - Production Validation Tests
# This script validates all critical backend validations before deployment
# 
# Usage: bash test-validations.sh [restaurant_slug] [base_url]
# Default: bash test-validations.sh blackstone http://localhost:3001/api/v1

set -e

# Configuration
SLUG="${1:-blackstone}"
BASE_URL="${2:-http://localhost:3001/api/v1}"
TIMESTAMP=$(date +%s)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to print test headers
print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"
}

# Helper function to run a test
run_test() {
  local test_name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -e "${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
  
  local response
  local http_code
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    echo -e "  Response: $(echo "$body" | head -c 100)...\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $http_code)"
    echo -e "  Response: $body\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

# Helper function to get tomorrow's date
get_tomorrow() {
  date -d "+1 day" "+%Y-%m-%d" 2>/dev/null || date -v+1d "+%Y-%m-%d" 2>/dev/null || echo "2024-12-25"
}

# Helper function to get a date beyond max advance booking
get_far_future() {
  date -d "+60 days" "+%Y-%m-%d" 2>/dev/null || date -v+60d "+%Y-%m-%d" 2>/dev/null || echo "2025-02-24"
}

# ============================================================================
print_header "TABLEAU RESERVATION SYSTEM - VALIDATION TEST SUITE"
echo "Configuration:"
echo "  Restaurant Slug: $SLUG"
echo "  Base URL: $BASE_URL"
echo "  Timestamp: $TIMESTAMP"
echo ""

# ============================================================================
print_header "1. CONNECTION & AVAILABILITY VERIFICATION"

run_test \
  "API Server responds to health check" \
  "GET" \
  "/public/$SLUG/info" \
  "" \
  "200"

run_test \
  "Availability endpoint accessible" \
  "GET" \
  "/public/$SLUG/availability?date=$(get_tomorrow)&time=19:00&partySize=2" \
  "" \
  "200"

# ============================================================================
print_header "2. DATE VALIDATION TESTS"

TOMORROW=$(get_tomorrow)
FAR_FUTURE=$(get_far_future)
YESTERDAY=$(date -d "yesterday" "+%Y-%m-%d" 2>/dev/null || date -v-1d "+%Y-%m-%d" 2>/dev/null || echo "2024-12-23")

run_test \
  "Reject reservation for past date" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$YESTERDAY\",
    \"startTime\": \"19:00\",
    \"endTime\": \"20:30\",
    \"partySize\": 2,
    \"guestFirstName\": \"John\",
    \"guestEmail\": \"john-past@test.com\",
    \"guestPhone\": \"555-0001\"
  }" \
  "400"

run_test \
  "Reject reservation beyond advance booking limit (60+ days)" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$FAR_FUTURE\",
    \"startTime\": \"19:00\",
    \"endTime\": \"20:30\",
    \"partySize\": 2,
    \"guestFirstName\": \"John\",
    \"guestEmail\": \"john-future@test.com\",
    \"guestPhone\": \"555-0002\"
  }" \
  "400"

# ============================================================================
print_header "3. OPERATING HOURS VALIDATION TESTS"

run_test \
  "Reject booking before restaurant opens (6:00 AM)" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"06:00\",
    \"endTime\": \"07:00\",
    \"partySize\": 2,
    \"guestFirstName\": \"Early\",
    \"guestEmail\": \"early@test.com\",
    \"guestPhone\": \"555-0003\"
  }" \
  "400"

run_test \
  "Reject booking after restaurant closes (11:30 PM endtime)" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"22:30\",
    \"endTime\": \"23:45\",
    \"partySize\": 2,
    \"guestFirstName\": \"Late\",
    \"guestEmail\": \"late@test.com\",
    \"guestPhone\": \"555-0004\"
  }" \
  "400"

# ============================================================================
print_header "4. TIME BOUNDARY VALIDATION TESTS"

run_test \
  "Reject reservation where end time equals start time" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"19:00\",
    \"endTime\": \"19:00\",
    \"partySize\": 2,
    \"guestFirstName\": \"Test\",
    \"guestEmail\": \"sametime@test.com\",
    \"guestPhone\": \"555-0005\"
  }" \
  "400"

run_test \
  "Reject reservation where end time before start time" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"20:00\",
    \"endTime\": \"19:00\",
    \"partySize\": 2,
    \"guestFirstName\": \"Backwards\",
    \"guestEmail\": \"backwards@test.com\",
    \"guestPhone\": \"555-0006\"
  }" \
  "400"

run_test \
  "Reject reservation that would exceed 24-hour boundary (23:00 + 120 min)" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"23:00\",
    \"partySize\": 2,
    \"guestFirstName\": \"Midnight\",
    \"guestEmail\": \"midnight@test.com\",
    \"guestPhone\": \"555-0007\"
  }" \
  "400"

# ============================================================================
print_header "5. PARTY SIZE VALIDATION TESTS"

run_test \
  "Reject party size exceeding maximum (e.g., 50 guests when max is 20)" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"19:00\",
    \"endTime\": \"20:30\",
    \"partySize\": 50,
    \"guestFirstName\": \"BigGroup\",
    \"guestEmail\": \"biggroup@test.com\",
    \"guestPhone\": \"555-0008\"
  }" \
  "400"

run_test \
  "Accept valid party size (4 guests)" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"19:00\",
    \"endTime\": \"20:30\",
    \"partySize\": 4,
    \"guestFirstName\": \"Valid\",
    \"guestEmail\": \"valid-group-${TIMESTAMP}@test.com\",
    \"guestPhone\": \"555-0009\"
  }" \
  "201"

# ============================================================================
print_header "6. CONTACT INFORMATION VALIDATION TESTS"

run_test \
  "Reject missing required field (firstName)" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"19:00\",
    \"endTime\": \"20:30\",
    \"partySize\": 2,
    \"guestFirstName\": \"\",
    \"guestEmail\": \"noname@test.com\",
    \"guestPhone\": \"555-0010\"
  }" \
  "400"

run_test \
  "Reject invalid email format" \
  "POST" \
  "/public/$SLUG/reserve" \
  "{
    \"reservationDate\": \"$TOMORROW\",
    \"startTime\": \"19:00\",
    \"endTime\": \"20:30\",
    \"partySize\": 2,
    \"guestFirstName\": \"Test\",
    \"guestEmail\": \"not-an-email\",
    \"guestPhone\": \"555-0011\"
  }" \
  "400"

# ============================================================================
print_header "TEST RESULTS SUMMARY"
echo -e "${BLUE}Total Tests Run:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}Failed:${NC} $FAILED_TESTS"
  echo -e "\n${GREEN}✓ ALL TESTS PASSED - SYSTEM IS PRODUCTION READY${NC}\n"
  exit 0
else
  echo -e "${RED}Failed:${NC} $FAILED_TESTS"
  echo -e "\n${RED}✗ SOME TESTS FAILED - FIX ISSUES BEFORE DEPLOYMENT${NC}\n"
  exit 1
fi
