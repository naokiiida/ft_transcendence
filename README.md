# ft_transcendence

_This project has been created as part of the 42 curriculum by niida, mkaihori, oohba_

## Description

ft_transcendence is a multi-user web application centered around a real-time competitive Pong game. Built with Next.js + NestJS, it supports local matches, AI matches, and online matchmaking.

It provides an integrated suite of features including authentication, user management, friend system, in-game chat, rating system, game statistics, and operational monitoring/analytics dashboards powered by Prometheus + Grafana.

---

## Instructions

### Prerequisites

- Docker and Docker Compose
- Git
- (For local development) Node.js 22+, npm

### Environment Variables

```bash
cp .env.example .env
```

Refer to `.env.example` for required variables (API URLs, session secret, 42 OAuth credentials, etc.).

### Getting Started (Docker)

```bash
# Start all profiles (with Traefik + Cloudflare Tunnel + Storybook)
make up
# or
docker compose --profile production --profile docs up --build
```

### Getting Started (Local Development)

```bash
make npm
```

### Access

| Service       | URL                                 |
| ------------- | ----------------------------------- |
| Frontend      | http://localhost:3000               |
| Backend API   | http://localhost:3001               |
| API Reference | http://localhost:3001/api/reference |
| Grafana       | http://localhost:3002               |
| Prometheus    | http://localhost:9090               |
| Storybook     | http://localhost:6006               |

### Stopping

```bash
make down
```

---

## Resources

- [NestJS Authentication](https://docs.nestjs.com/security/authentication#enable-authentication-globally)
- [Ministry of Internal Affairs and Communications AI White Paper (Definition of AI)](https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r01/html/nd113210.html)
- [Multer in Node.js](https://betterstack.com/community/guides/scaling-nodejs/multer-in-nodejs/)
- [Scalar NestJS API Reference](https://scalar.com/products/api-references/integrations/nestjs)
- [Grafana Dashboard JSON Model](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/view-dashboard-json-model/)
- [ft_transcendence Guide (Zenn)](https://zenn.dev/mfunyu/books/ft_transcendence)
- [Pong Game Reference Implementation](https://gist.github.com/straker/81b59eecf70da93af396f963596dfdc5)

### Use of AI

In this project, AI (Claude Code, etc.) was utilized in the following areas:

- **Code Review**: Quality checks and improvement suggestions during PR reviews
- **Specification Writing**: Assistance in creating design documents and API specifications
- **Implementation Proposals**: Comparative evaluation of approaches for technical challenges

---

## Team Information

| Member       | Role                                      | Responsibilities                                                                                                                |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **niida**    | Product Owner, Project Manager, Developer | Defining product vision, project management, implementing User Management, DevOps, Monitoring, Chat, Statistics, and Public API |
| **oohba**    | Technical Lead, Developer                 | Designing technical architecture, implementing AI matches, Remote matches, and Game Customization                               |
| **mkaihori** | Developer                                 | Implementing Pong game (local matches) and 42 OAuth authentication                                                              |

---

## Project Management

- **Communication**: Real-time information sharing and discussions via Discord
- **Task Management**: Issue creation, assignment, and progress tracking via GitHub Issues
- **Code Review**: Pull Request-based review process
- **Meetings**: Regular progress checks and decision-making

---

## Technical Stack

| Category                    | Technology                                             | Rationale                                                                                 |
| --------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Frontend**                | Next.js 15 (App Router), React 19, TypeScript          | Improved development efficiency through file-based routing and flexible SSR/CSR switching |
| **Styling**                 | Tailwind CSS, shadcn/ui (Radix UI)                     | Rapid construction of accessible and consistent UI with utility-first CSS                 |
| **Backend**                 | NestJS 11, TypeScript, Express                         | Building a maintainable API server with modular structure, DI, and decorator-based design |
| **Real-time Communication** | WebSocket (NestJS WebSocket Gateway)                   | Addressing real-time requirements such as Pong match synchronization and chat             |
| **Database**                | SQLite + Drizzle ORM                                   | Combining lightweight operation (file-based DB) with type-safe schema management          |
| **Authentication**          | Email/Password (password hashing + sessions), 42 OAuth | Robust basic authentication combined with 42 ecosystem integration                        |
| **Validation**              | Zod                                                    | Type-safe validation with shared schema definitions across frontend and backend           |
| **Monitoring**              | Prometheus + Grafana                                   | Ensuring system observability through metrics collection and visualization                |
| **Reverse Proxy**           | Traefik                                                | Automated routing and HTTPS termination                                                   |
| **Containers**              | Docker, Docker Compose                                 | Building reproducible development and production environments                             |
| **Testing**                 | Jest, Vitest, Playwright                               | Quality assurance through unit, integration, and E2E testing                              |
| **Documentation**           | Storybook, Scalar (API Reference)                      | Component catalog and interactive API documentation                                       |

---

## Database Schema

Composed of 4 tables. Type-safe schema management with SQLite + Drizzle ORM.

### users

| Column           | Type            | Description                                |
| ---------------- | --------------- | ------------------------------------------ |
| `uuid`           | TEXT (PK)       | User identifier (UUID)                     |
| `email`          | TEXT (UNIQUE)   | Email address                              |
| `password_hash`  | TEXT (NULLABLE) | Password hash (NULL for OAuth users)       |
| `display_name`   | TEXT (UNIQUE)   | Display name                               |
| `avatar_url`     | TEXT (NULLABLE) | Avatar image URL                           |
| `intra_id`       | TEXT (UNIQUE)   | 42 Intra ID                                |
| `intra_username` | TEXT (UNIQUE)   | 42 Intra username                          |
| `wins`           | INTEGER         | Number of wins (default: 0)                |
| `losses`         | INTEGER         | Number of losses (default: 0)              |
| `user_score`     | INTEGER         | Rating (default: 1000, win +25 / loss -25) |
| `method`         | TEXT            | Authentication method ('email' \| 'intra') |
| `created_at`     | TEXT            | Creation timestamp                         |
| `last_seen`      | TEXT            | Last active timestamp                      |

### sessions

| Column       | Type              | Description              |
| ------------ | ----------------- | ------------------------ |
| `id`         | TEXT (PK)         | Session ID (UUID)        |
| `user_id`    | TEXT (FK → users) | User ID (CASCADE DELETE) |
| `expires_at` | TEXT              | Expiration time          |
| `created_at` | TEXT              | Creation timestamp       |

### games

| Column          | Type                        | Description                                        |
| --------------- | --------------------------- | -------------------------------------------------- |
| `id`            | TEXT (PK)                   | Game ID (UUID)                                     |
| `player1_id`    | TEXT (FK → users)           | Player 1                                           |
| `player2_id`    | TEXT (FK → users, NULLABLE) | Player 2 (online matches)                          |
| `winner_id`     | TEXT (FK → users, NULLABLE) | Winner                                             |
| `player1_score` | INTEGER                     | Player 1 score                                     |
| `player2_score` | INTEGER                     | Player 2 score                                     |
| `game_type`     | TEXT                        | 'local' \| 'online' \| 'ai'                        |
| `ai_difficulty` | TEXT                        | 'easy' \| 'medium' \| 'hard' \| 'EuropeanHard'     |
| `status`        | TEXT                        | 'waiting' \| 'playing' \| 'completed' \| 'forfeit' |
| `score_delta`   | INTEGER                     | Rating change (±25)                                |
| `started_at`    | TEXT                        | Start timestamp                                    |
| `ended_at`      | TEXT                        | End timestamp                                      |
| `created_at`    | TEXT                        | Creation timestamp                                 |

### friendships

| Column         | Type              | Description                           |
| -------------- | ----------------- | ------------------------------------- |
| `id`           | TEXT (PK)         | Friendship ID (UUID)                  |
| `requester_id` | TEXT (FK → users) | Request sender (CASCADE DELETE)       |
| `addressee_id` | TEXT (FK → users) | Request receiver (CASCADE DELETE)     |
| `status`       | TEXT              | 'pending' \| 'accepted' \| 'declined' |
| `created_at`   | TEXT              | Creation timestamp                    |
| `updated_at`   | TEXT              | Update timestamp                      |

### Relationships

```text
users 1─∞ sessions    (User → Sessions)
users 1─∞ games       (player1_id, player2_id, winner_id)
users 1─∞ friendships (requester_id, addressee_id)
```

---

## Features List

| Feature                        | Description                                                               | Owner    |
| ------------------------------ | ------------------------------------------------------------------------- | -------- |
| **Pong Local Match**           | 2-player mode on the same screen                                          | mkaihori |
| **Pong AI Match**              | AI matches with 4 difficulty levels (Easy / Medium / Hard / EuropeanHard) | oohba    |
| **Pong Online Match**          | Real-time remote matches via matchmaking queue                            | oohba    |
| **Game Customization**         | Customization of game settings                                            | oohba    |
| **In-game Chat**               | Text messaging during matches                                             | niida    |
| **User Registration/Login**    | Email/Password authentication (password hashing + session management)     | niida    |
| **42 OAuth**                   | Login via 42 Intra account                                                | mkaihori |
| **User Profile**               | Display and edit display name, avatar, and match records                  | niida    |
| **Friend System**              | Friend requests, acceptance, listing, and removal                         | niida    |
| **User Search**                | Search users by display name                                              | niida    |
| **Leaderboard**                | Ranking display by rating                                                 | niida    |
| **Match History & Statistics** | Past match records and win rate/rating progression                        | niida    |
| **Prometheus Metrics**         | Collection of request count, latency, WebSocket connections, etc.         | niida    |
| **Grafana Dashboard**          | Visualization of backend and application analytics                        | niida    |
| **Analytics Dashboard**        | Data visualization of user behavior and match results                     | niida    |
| **Public API**                 | Interactive API reference via Scalar                                      | niida    |
| **Design System**              | Reusable UI components based on shadcn/ui + Storybook                     | masho    |
| **Privacy Policy / Terms**     | Terms of service and privacy policy pages                                 | All      |

---

## Modules

**Total Points: Major 9 × 2pt + Minor 5 × 1pt = 23pt**

### Major Modules (2pt each)

| Module                          | Owner    | Rationale                                                                                                                                                  | Implementation                                                                                                            |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Web (Next.js + NestJS)**      | All      | Adopting frontend/backend frameworks to meet requirements while ensuring development experience and maintainability                                        | Next.js 15 (App Router) + NestJS 11. Integrated via Docker Compose. Traefik reverse proxy for production                  |
| **User Management**             | niida    | Foundation for authentication, profiles, and friend features to meet mandatory multi-user requirements                                                     | Authentication via password hashing + session DB management. Zod validation. Relationship management via friendship table |
| **Web-based game (Pong)**       | mkaihori | Providing the core real-time competitive game of the project                                                                                               | Canvas-based game rendering. Tick-based game engine (server-authoritative model)                                          |
| **AI Opponent**                 | oohba    | Delivering challenging AI matches that simulate human-like behavior. AI definition follows the Ministry of Internal Affairs and Communications white paper | 4 difficulty levels. Prediction and reaction speed adjustment via paddle tracking algorithms                              |
| **Remote Players**              | oohba    | Enabling matches between separate devices while addressing real-world challenges such as latency and reconnection                                          | Real-time synchronization via WebSocket Gateway. Matchmaking queue system. Input sequence numbers for order guarantee     |
| **DevOps (Prometheus+Grafana)** | niida    | Ensuring monitoring and observability to guarantee quality and operability                                                                                 | Metrics collection with prom-client. Prometheus + Grafana integrated via Docker Compose. Pre-provisioned dashboards       |
| **Analytics Dashboard**         | niida    | Providing visualization of user behavior/match results for accountability and improvement metrics during evaluation                                        | Application analytics and backend overview visualization via Grafana dashboards                                           |
| **User interaction (Chat)**     | niida    | Enhancing user interaction and maximizing the value of real-time capabilities                                                                              | In-game chat via WebSocket. Send/receive using `chat_message` / `chat_received` message types                             |
| **Public API**                  | niida    | Promoting development efficiency and external integration through automatic API documentation generation                                                   | Interactive API reference via NestJS Swagger + Scalar (`/api/reference`)                                                  |

### Minor Modules (1pt each)

| Module                 | Owner    | Rationale                                                                                           | Implementation                                                                |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **42 OAuth**           | mkaihori | Improving convenience and security through 42 ecosystem integration                                 | 42 Intra OAuth 2.0 flow. Linking via `intra_id` / `intra_username`            |
| **Game Customization** | oohba    | Expanding the range of game experiences and creating differentiating factors                        | Customization of game setting parameters                                      |
| **Design System**      | masho    | Establishing reusable components to improve UI consistency and development efficiency               | Based on shadcn/ui (Radix UI). Component catalog managed via Storybook        |
| **Game statistics**    | niida    | Enhancing user experience through win/loss and history display, also addressing evaluation criteria | Match history API (`/api/games/history/:userId`). Win/loss-based rating (±25) |
| **ORM (Drizzle)**      | All      | Making data access type-safe while improving schema management and maintainability                  | Drizzle ORM + better-sqlite3. Type-safe query builder and schema definitions  |

---

## Individual Contributions

### niida (Product Owner / Project Manager / Developer)

- **Modules**: User Management, DevOps, Analytics Dashboard, User interaction (Chat), Game statistics, Public API
- **Key Contributions**:
  - Implementation of Email/Password authentication system (password hashing + session management)
  - Design and implementation of user profile features (display name, avatar upload) and friend system
  - Building monitoring infrastructure with Prometheus + Grafana and creating pre-provisioned dashboards
  - Implementation of in-game chat functionality using WebSocket
  - Design and implementation of match history API and rating system (win +25 / loss -25)
  - Automatic API documentation generation with NestJS Swagger + Scalar
  - Managing infrastructure configuration with Docker Compose
  - Overall project progress management and product backlog organization
- **Challenges and Solutions**:
  - Prometheus metrics and Grafana dashboard integration required trial and error with datasource provisioning configuration. Resolved by deepening understanding of official documentation and JSON models
  - Simultaneous management of chat and game state via WebSocket was addressed by designing appropriate message types for integration
  - Focused on balancing session management with security requirements (HTTP-only cookies, CSRF protection)

### oohba (Technical Lead / Developer)

- **Modules**: AI Opponent, Remote Players, Game Customization
- **Key Contributions**:
  - Implementation of 4-level AI match algorithms
  - Real-time game synchronization and matchmaking system using WebSocket Gateway
  - Implementation of game customization features
  - Technical architecture design and review of important code changes
- **Challenges and Solutions**:
  - Introduced input sequence numbers for order guarantee as a latency countermeasure in online matches
  - Optimized parameters through extensive playtesting for AI difficulty balancing

### mkaihori (Developer)

- **Modules**: Web-based game (Pong), 42 OAuth
- **Key Contributions**:
  - Design of Pong game engine and Canvas-based rendering implementation
  - Tick-based game logic with server-authoritative model
  - Implementation of local match mode
  - Implementation of 42 Intra OAuth 2.0 authentication flow
- **Challenges and Solutions**:
  - Addressed frame rate dependency issues in game loop design by implementing tick-based fixed update intervals for stable operation

Special thanks go to masho, whose work on the UI components remains a cornerstone of this project’s design.
We are deeply grateful for the expertise she brought to the team. We also thank thashimo, who transitioned to another team.
