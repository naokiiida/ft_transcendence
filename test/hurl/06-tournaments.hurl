# Tournament System API Tests
# Run: hurl --test --variable timestamp=$(date +%s) --variable base_url=http://localhost:3000 --cookie-jar /dev/null test/hurl/06-tournaments.hurl

# ============ Unauthenticated Tests (MUST RUN FIRST) ============

# Test 1: List tournaments without auth succeeds (public endpoint)
GET {{base_url}}/api/tournaments
HTTP 200
[Asserts]
jsonpath "$.tournaments" isCollection

# Test 2: Create tournament without auth fails
POST {{base_url}}/api/tournaments
Content-Type: application/json
{
  "name": "Test Tournament",
  "maxPlayers": 8
}
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 3: Join tournament without auth fails
POST {{base_url}}/api/tournaments/1/join
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 4: Start tournament without auth fails
POST {{base_url}}/api/tournaments/1/start
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# ============ Setup: Create Test User ============

# Test 5: Register tournament creator
POST {{base_url}}/auth/register
Content-Type: application/json
{
  "email": "tourn_{{timestamp}}@test.local",
  "username": "tourn_{{timestamp}}",
  "password": "TestPass123!",
  "displayName": "Tournament Creator"
}
HTTP 201
[Captures]
creator_session: cookie "session"
creator_id: jsonpath "$.user.id"

# ============ Tournament Creation ============

# Test 6: Create tournament with valid data
POST {{base_url}}/api/tournaments
Cookie: session={{creator_session}}
Content-Type: application/json
{
  "name": "Test Tournament {{timestamp}}",
  "description": "A test tournament",
  "maxPlayers": 4
}
HTTP 201
[Captures]
tournament_id: jsonpath "$.tournament.id"
[Asserts]
jsonpath "$.tournament.name" == "Test Tournament {{timestamp}}"
jsonpath "$.tournament.maxPlayers" == 4
jsonpath "$.tournament.status" == "registration"

# Test 7: Create tournament with short name fails
POST {{base_url}}/api/tournaments
Cookie: session={{creator_session}}
Content-Type: application/json
{
  "name": "AB",
  "maxPlayers": 8
}
HTTP 400
[Asserts]
jsonpath "$.error" == "Name must be 3-50 characters"

# Test 8: Create tournament with invalid maxPlayers fails
POST {{base_url}}/api/tournaments
Cookie: session={{creator_session}}
Content-Type: application/json
{
  "name": "Invalid Size Tournament",
  "maxPlayers": 5
}
HTTP 400
[Asserts]
jsonpath "$.error" == "Max players must be 4, 8, or 16"

# ============ Tournament Details ============

# Test 9: Get tournament details
GET {{base_url}}/api/tournaments/{{tournament_id}}
HTTP 200
[Asserts]
jsonpath "$.tournament.id" == {{tournament_id}}
jsonpath "$.tournament.name" == "Test Tournament {{timestamp}}"
jsonpath "$.tournament.entries" isCollection
jsonpath "$.tournament.entries" count == 1

# Test 10: Get nonexistent tournament fails
GET {{base_url}}/api/tournaments/99999
HTTP 404
[Asserts]
jsonpath "$.error" == "Tournament not found"

# ============ Tournament Registration ============

# Test 11: Creator is already joined (from creation)
POST {{base_url}}/api/tournaments/{{tournament_id}}/join
Cookie: session={{creator_session}}
HTTP 409
[Asserts]
jsonpath "$.error" == "Already joined this tournament"

# Test 12: Leave tournament
POST {{base_url}}/api/tournaments/{{tournament_id}}/leave
Cookie: session={{creator_session}}
HTTP 200
[Asserts]
jsonpath "$.message" == "Left tournament successfully"

# Test 13: Rejoin tournament
POST {{base_url}}/api/tournaments/{{tournament_id}}/join
Cookie: session={{creator_session}}
HTTP 200
[Asserts]
jsonpath "$.message" == "Joined tournament successfully"

# ============ Tournament Start Validation ============

# Test 14: Start tournament with only 1 player fails
POST {{base_url}}/api/tournaments/{{tournament_id}}/start
Cookie: session={{creator_session}}
HTTP 400
[Asserts]
jsonpath "$.error" == "Need at least 2 players to start"

# ============ List Tournaments ============

# Test 15: List all tournaments
GET {{base_url}}/api/tournaments
HTTP 200
[Asserts]
jsonpath "$.tournaments" isCollection

# Test 16: Filter tournaments by status
GET {{base_url}}/api/tournaments?status=registration
HTTP 200
[Asserts]
jsonpath "$.tournaments" isCollection

# Test 17: Filter finished tournaments
GET {{base_url}}/api/tournaments?status=finished
HTTP 200
[Asserts]
jsonpath "$.tournaments" isCollection
