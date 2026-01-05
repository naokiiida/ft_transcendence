# Health Check Tests
# Run: hurl --test test/hurl/01-health.hurl

# Basic health endpoint
GET http://localhost:3000/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
