# Health Check Tests
# Run: hurl --test --variable base_url=http://localhost:3000 test/hurl/01-health.hurl

# Basic health endpoint
GET {{base_url}}/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
