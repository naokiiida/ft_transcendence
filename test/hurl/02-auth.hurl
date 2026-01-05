# Authentication Flow Tests
# Run: hurl --test --variable timestamp=$(date +%s) test/hurl/02-auth.hurl
#
# These tests validate the email/password authentication flow.
# Note: Hurl shares cookies, so unauthenticated tests MUST run first.

# ============ Unauthenticated Tests (MUST RUN FIRST) ============

# Test 1: Get current user without session fails
GET http://localhost:3000/auth/me
HTTP 401

# ============ Validation Tests ============

# Test 2: Registration with invalid email fails
POST http://localhost:3000/auth/register
Content-Type: application/json
{
  "email": "invalid-email",
  "username": "testuser",
  "password": "TestPass123",
  "displayName": "Test User"
}
HTTP 400
[Asserts]
jsonpath "$.error" contains "email"

# Test 3: Registration with weak password fails (no uppercase)
POST http://localhost:3000/auth/register
Content-Type: application/json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "weakpass123",
  "displayName": "Test User"
}
HTTP 400
[Asserts]
jsonpath "$.error" contains "Password"

# Test 4: Registration with weak password fails (no number)
POST http://localhost:3000/auth/register
Content-Type: application/json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "WeakPassword",
  "displayName": "Test User"
}
HTTP 400
[Asserts]
jsonpath "$.error" contains "Password"

# ============ Successful Registration ============

# Test 5: Successful registration
POST http://localhost:3000/auth/register
Content-Type: application/json
{
  "email": "player1_{{timestamp}}@test.local",
  "username": "player1_{{timestamp}}",
  "password": "TestPass123!",
  "displayName": "Player One"
}
HTTP 201
[Asserts]
jsonpath "$.success" == true
jsonpath "$.user.login" startsWith "player1_"
jsonpath "$.user.displayName" == "Player One"
jsonpath "$.user.authMethod" == "local"
header "Set-Cookie" contains "session="
[Captures]
player1_session: cookie "session"

# Test 6: Duplicate email registration fails
POST http://localhost:3000/auth/register
Content-Type: application/json
{
  "email": "player1_{{timestamp}}@test.local",
  "username": "different_user",
  "password": "TestPass123!",
  "displayName": "Different User"
}
HTTP 409
[Asserts]
jsonpath "$.error" contains "Email"

# Test 7: Duplicate username registration fails
POST http://localhost:3000/auth/register
Content-Type: application/json
{
  "email": "different_{{timestamp}}@test.local",
  "username": "player1_{{timestamp}}",
  "password": "TestPass123!",
  "displayName": "Different User"
}
HTTP 409
[Asserts]
jsonpath "$.error" contains "Username"

# Test 8: Login with wrong password fails
POST http://localhost:3000/auth/local/login
Content-Type: application/json
{
  "email": "player1_{{timestamp}}@test.local",
  "password": "WrongPassword123!"
}
HTTP 401
[Asserts]
jsonpath "$.error" contains "Invalid"

# Test 9: Login with correct credentials succeeds
POST http://localhost:3000/auth/local/login
Content-Type: application/json
{
  "email": "player1_{{timestamp}}@test.local",
  "password": "TestPass123!"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.user.login" startsWith "player1_"
header "Set-Cookie" contains "session="

# Test 10: Get current user with valid session succeeds
GET http://localhost:3000/auth/me
Cookie: session={{player1_session}}
HTTP 200
[Asserts]
jsonpath "$.user.login" startsWith "player1_"
