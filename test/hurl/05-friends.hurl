# Friends System API Tests
# Run: hurl --test --variable timestamp=$(date +%s) --variable base_url=http://localhost:3000 --cookie-jar /dev/null test/hurl/05-friends.hurl
#
# NOTE: Due to Hurl's automatic cookie handling, multi-user friend request tests
# are in a separate bun test file. This file tests:
# - Unauthenticated access rejection
# - Single-user friends API functionality
# - Error handling for edge cases

# ============ Unauthenticated Tests (MUST RUN FIRST) ============

# Test 1: Get friends without auth fails
GET {{base_url}}/api/friends
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 2: Get friend requests without auth fails
GET {{base_url}}/api/friends/requests
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 3: Send friend request without auth fails
POST {{base_url}}/api/friends/request/someuser
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 4: Accept friend request without auth fails
POST {{base_url}}/api/friends/accept/1
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 5: Reject friend request without auth fails
POST {{base_url}}/api/friends/reject/1
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# Test 6: Remove friend without auth fails
DELETE {{base_url}}/api/friends/someuser
HTTP 401
[Asserts]
jsonpath "$.error" == "Unauthorized"

# ============ Setup: Create Test User ============

# Test 7: Register test user
POST {{base_url}}/auth/register
Content-Type: application/json
{
  "email": "fr_{{timestamp}}@test.local",
  "username": "fr_{{timestamp}}",
  "password": "TestPass123!",
  "displayName": "Friend Test User"
}
HTTP 201
[Captures]
test_session: cookie "session"
test_login: jsonpath "$.user.login"

# ============ Friends List (Empty Initially) ============

# Test 8: Friends list should be empty for new user
GET {{base_url}}/api/friends
Cookie: session={{test_session}}
HTTP 200
[Asserts]
jsonpath "$.friends" isCollection
jsonpath "$.friends" count == 0

# Test 9: Friend requests should be empty for new user
GET {{base_url}}/api/friends/requests
Cookie: session={{test_session}}
HTTP 200
[Asserts]
jsonpath "$.received" isCollection
jsonpath "$.received" count == 0
jsonpath "$.sent" isCollection
jsonpath "$.sent" count == 0

# ============ Edge Cases ============

# Test 10: Cannot send friend request to yourself
POST {{base_url}}/api/friends/request/{{test_login}}
Cookie: session={{test_session}}
HTTP 400
[Asserts]
jsonpath "$.error" contains "yourself"

# Test 11: Cannot send friend request to non-existent user
POST {{base_url}}/api/friends/request/nonexistent_user_xyz
Cookie: session={{test_session}}
HTTP 404
[Asserts]
jsonpath "$.error" contains "not found"

# Test 12: Cannot accept non-existent request
POST {{base_url}}/api/friends/accept/999999
Cookie: session={{test_session}}
HTTP 404
[Asserts]
jsonpath "$.error" contains "not found"

# Test 13: Cannot reject non-existent request
POST {{base_url}}/api/friends/reject/999999
Cookie: session={{test_session}}
HTTP 404
[Asserts]
jsonpath "$.error" contains "not found"

# Test 14: Cannot remove non-friend
DELETE {{base_url}}/api/friends/nonexistent_user
Cookie: session={{test_session}}
HTTP 404
[Asserts]
jsonpath "$.error" contains "not found"

# Test 15: Invalid request ID format
POST {{base_url}}/api/friends/accept/invalid
Cookie: session={{test_session}}
HTTP 400
[Asserts]
jsonpath "$.error" contains "Invalid"

# Test 16: Invalid request ID format for reject
POST {{base_url}}/api/friends/reject/invalid
Cookie: session={{test_session}}
HTTP 400
[Asserts]
jsonpath "$.error" contains "Invalid"
