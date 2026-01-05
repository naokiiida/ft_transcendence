# User Management API Tests
# Run: hurl --test --variable timestamp=$(date +%s) --variable base_url=http://localhost:3000 --cookie-jar /dev/null test/hurl/04-user-management.hurl
#
# These tests validate user profile, avatar, and match history functionality.
# Note: Hurl shares cookies, so UNAUTHENTICATED TESTS MUST RUN FIRST.

# ============ Unauthenticated Tests (MUST RUN FIRST) ============

# Test 1: Update profile without auth fails
PATCH {{base_url}}/api/users/me
Content-Type: application/json
{
  "displayName": "Should Fail"
}
HTTP 401

# Test 2: Upload avatar without auth fails
POST {{base_url}}/api/users/me/avatar
Content-Type: application/json
{
  "avatar": "not-a-file"
}
HTTP 401

# Test 3: Get match history without auth fails
GET {{base_url}}/api/matches
HTTP 401

# ============ Public Endpoints (No Auth Required) ============

# Test 4: Get leaderboard (public)
GET {{base_url}}/api/leaderboard
HTTP 200
[Asserts]
jsonpath "$.leaderboard" isCollection

# Test 5: Get leaderboard with limit
GET {{base_url}}/api/leaderboard?limit=5
HTTP 200
[Asserts]
jsonpath "$.leaderboard" isCollection

# Test 6: Get non-existent user profile
GET {{base_url}}/api/users/nonexistent_user_xyz
HTTP 404
[Asserts]
jsonpath "$.error" contains "not found"

# Test 7: Get match history for non-existent user
GET {{base_url}}/api/users/nonexistent_user_xyz/matches
HTTP 404
[Asserts]
jsonpath "$.error" contains "not found"

# ============ Setup: Create Test User ============

# Test 8: Register test user for user management tests
POST {{base_url}}/auth/register
Content-Type: application/json
{
  "email": "usermgmt_{{timestamp}}@test.local",
  "username": "usermgmt_{{timestamp}}",
  "password": "TestPass123!",
  "displayName": "User Mgmt Test"
}
HTTP 201
[Asserts]
jsonpath "$.success" == true
jsonpath "$.user.login" startsWith "usermgmt_"
[Captures]
user_session: cookie "session"
user_login: jsonpath "$.user.login"

# ============ Authenticated Profile Tests ============

# Test 9: Get own profile via /auth/me
GET {{base_url}}/auth/me
Cookie: session={{user_session}}
HTTP 200
[Asserts]
jsonpath "$.user.login" startsWith "usermgmt_"
jsonpath "$.user.displayName" == "User Mgmt Test"

# Test 10: Get profile via public endpoint
GET {{base_url}}/api/users/{{user_login}}
HTTP 200
[Asserts]
jsonpath "$.user.login" startsWith "usermgmt_"
jsonpath "$.user.displayName" == "User Mgmt Test"
jsonpath "$.user.wins" == 0
jsonpath "$.user.losses" == 0
jsonpath "$.user.rating" == 1000

# Test 11: Update display name
PATCH {{base_url}}/api/users/me
Cookie: session={{user_session}}
Content-Type: application/json
{
  "displayName": "Updated Display Name"
}
HTTP 200
[Asserts]
jsonpath "$.user.displayName" == "Updated Display Name"

# Test 12: Verify display name was updated
GET {{base_url}}/api/users/{{user_login}}
HTTP 200
[Asserts]
jsonpath "$.user.displayName" == "Updated Display Name"

# Test 13: Update with invalid display name (too long)
PATCH {{base_url}}/api/users/me
Cookie: session={{user_session}}
Content-Type: application/json
{
  "displayName": "This display name is way too long and should be rejected by the server because it exceeds the maximum allowed length"
}
HTTP 400
[Asserts]
jsonpath "$.error" contains "1-50 characters"

# Test 14: Update with empty display name
PATCH {{base_url}}/api/users/me
Cookie: session={{user_session}}
Content-Type: application/json
{
  "displayName": ""
}
HTTP 400
[Asserts]
jsonpath "$.error" contains "1-50 characters"

# ============ Avatar Tests ============

# Note: Hurl doesn't support multipart/form-data file uploads natively.
# Avatar upload is tested via bun test or manual testing.

# Test 15: Upload avatar with wrong content type
POST {{base_url}}/api/users/me/avatar
Cookie: session={{user_session}}
Content-Type: application/json
{
  "avatar": "not-a-file"
}
HTTP 400
[Asserts]
jsonpath "$.error" contains "multipart/form-data"

# ============ Match History Tests ============

# Test 16: Get own match history (should be empty for new user)
GET {{base_url}}/api/matches
Cookie: session={{user_session}}
HTTP 200
[Asserts]
jsonpath "$.matches" isCollection

# Test 17: Get match history for specific user (public endpoint)
GET {{base_url}}/api/users/{{user_login}}/matches
HTTP 200
[Asserts]
jsonpath "$.matches" isCollection

# Test 18: Get match history with pagination
GET {{base_url}}/api/matches?limit=5&offset=0
Cookie: session={{user_session}}
HTTP 200
[Asserts]
jsonpath "$.matches" isCollection
