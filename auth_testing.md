# Auth Testing Playbook 3M SERVICES

Credentials: see /app/memory/test_credentials.md (admin@capentrepreneurs.ca / CAP Admin 2026!)

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify: bcrypt hash starts with `$2b$`; unique index on users.email; index on login_attempts.identifier and submissions.type.

## Step 2: API Testing
```
curl  c cookies.txt  X POST $API_URL/api/auth/login  H "Content Type: application/json"  d '{"email":"admin@capentrepreneurs.ca","password":"CAP Admin 2026!"}'
cat cookies.txt
curl  b cookies.txt $API_URL/api/auth/me
curl  b cookies.txt $API_URL/api/admin/submissions
```
Login returns the user object and sets access_token + refresh_token cookies. /me returns the same user. Wrong password returns 401 and increments login_attempts (5 failures = 15 min lockout).
