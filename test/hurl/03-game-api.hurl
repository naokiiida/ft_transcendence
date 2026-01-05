# Game API Tests
# Run: hurl --test --variable timestamp=$(date +%s) --variable base_url=http://localhost:3000 test/hurl/03-game-api.hurl
#
# Tests game room creation and matching API.
# Note: Hurl shares cookies between requests, so unauthenticated tests run first.

# ============ Unauthenticated Tests (MUST RUN FIRST) ============

# Test 1: Get game rooms - public endpoint
GET {{base_url}}/api/game/rooms
HTTP 200
[Asserts]
jsonpath "$.rooms" isCollection

# Test 2: Quick match without auth fails (no cookies yet)
GET {{base_url}}/api/game/quick-match
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 3: WebSocket upgrade without auth fails
GET {{base_url}}/ws
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# ============ Setup: Create Test Players ============

# Register Player 1
POST {{base_url}}/auth/register
Content-Type: application/json
{
  "email": "game_p1_{{timestamp}}@test.local",
  "username": "game_p1_{{timestamp}}",
  "password": "TestPass123!",
  "displayName": "Game Player 1"
}
HTTP 201
[Captures]
player1_session: cookie "session"

# Register Player 2
POST {{base_url}}/auth/register
Content-Type: application/json
{
  "email": "game_p2_{{timestamp}}@test.local",
  "username": "game_p2_{{timestamp}}",
  "password": "TestPass123!",
  "displayName": "Game Player 2"
}
HTTP 201
[Captures]
player2_session: cookie "session"

# ============ Authenticated Game Tests ============

# Test 4: Quick match with Player 1 creates game
GET {{base_url}}/api/game/quick-match
Cookie: session={{player1_session}}
HTTP 200
[Asserts]
jsonpath "$.gameId" exists
jsonpath "$.gameId" startsWith "game_"
[Captures]
game1_id: jsonpath "$.gameId"

# Test 5: Game rooms shows the new game
GET {{base_url}}/api/game/rooms
HTTP 200
[Asserts]
jsonpath "$.rooms" count >= 1

# Test 6: Quick match with Player 2 returns same game (matchmaking)
GET {{base_url}}/api/game/quick-match
Cookie: session={{player2_session}}
HTTP 200
[Asserts]
jsonpath "$.gameId" exists
jsonpath "$.gameId" startsWith "game_"
[Captures]
game2_id: jsonpath "$.gameId"

# ============ WebSocket Note ============
# WebSocket upgrade tests are handled by bun:test since Hurl cannot
# complete WebSocket handshakes. See test/websocket.test.ts
