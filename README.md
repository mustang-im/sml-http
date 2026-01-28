# sml-http
SML HTTP server to host simple JSON snipplets

### Implementation

Node.js + TypeScript REST server (no UI) implementing the sml-http specification.

The service provides:
- Email-based registration with confirmation link
- JWT access tokens
- Resource storage API under /r/:bundle/:filename
- Ownership enforced per bundle
- MySQL / MariaDB persistence
- Docker & docker-compose setup
- HTTPS termination recommended via external reverse proxy (e.g. Caddy)

### External service dependencies

* HTTPS is expected to be terminated by an external reverse proxy (e.g. Caddy).
* EMail delivery requires a valid SMTP configuration.
* MySQL is part of this docker-compose
* This project intentionally contains no UI.

### Requirements

- Docker & Docker Compose
- A working SMTP  for sending confirmation emails
- An external HTTPS reverse proxy (not included)

### Quickstart

1. Create a .env file based on .env.example
2.  Build and start the services:
    - docker compose up -d --build
3. Health check:
    - curl http://localhost:3000/health
    - Expected response: { "status": "ok" }

# Configuration

### Environment Variables

- All required variables are documented in .env.example
### Server
PORT (Port the HTTP server listens on)
PUBLIC_BASE_URL (Base URL used to generate the email confirmation link)

### JWT
JWT_CONFIRM_SECRET (Secret used to sign confirmation tokens)
JWT_ACCESS_SECRET (Secret used to sign access tokens)
JWT_CONFIRM_TTL

### Database (used by the Node app)

DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD

### Database (used by docker compose / mysql container)
DB_ROOT_PASSWORD

### SMTP
MAIL_FROM
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS


# API specs

## Authentication Flow

1. Register
-   Starts the registration process and sends a confirmation email.
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","emailAddress":"john@example.com"}'

Response:
{ "message": "Registration initiated" }

2. Confirm Email
- Open the confirmation link received via email:
GET /register/confirm?code=...
- Response
{
  "access_token": "...",
  "token_type": "Bearer",
  "scope": "read write"
}

3. Get Current User
curl http://localhost:3000/me \
  -H "Authorization: Bearer <access_token>"

## Resource creation and retrieval

4. Resource API
PUT /r/:bundle/:filename

Creates or updates a resource.
The request body is stored as JSON without modification.

curl -X PUT "http://localhost:3000/r/foo/a" \
  -H "Authorization: Bearer <access_token>" \
  -H "Public-Access: read" \
  -H "Content-Type: application/json" \
  -d '{"hello":"world"}'
  Response:

{ "status": "created" }

5. GET /r/:bundle/:filename

- Returns the stored JSON if the requester has read access.

curl "http://localhost:3000/r/foo/a" \
  -H "Authorization: Bearer <access_token>"

6. GET /r/:bundle

Lists all readable resources under the given bundle.

curl "http://localhost:3000/r/foo" \
  -H "Authorization: Bearer <access_token>"


## Resource ownership

- Ownership is enforced per bundle:
- The first user who writes any resource under an bundle becomes the owner of that bundle.
- Only the owner may write under the same bundle.
- Other users attempting to write under an existing bundle receive 403 Forbidden.
- Read access depends on the resource visibility passed in HTTP header `Public-Access` and is either:
`read` = Everybody with the URL can read it,
`write`  = Everybody with the URL can modify it, or
`none` = Private.
- The owner always has write access, independent of the `Public-Access` setting.
