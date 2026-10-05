# TinyURL — URL Shortening & Click Analytics Service

A full-stack URL shortening application built with Spring Boot and React. The project separates storage responsibilities across Redis, MongoDB, and Cassandra to support fast redirects, user/URL metadata, and click-history analytics.

## Quick Links

- **Live Demo:** [etinyurl.vercel.app](https://etinyurl.vercel.app/)
- **API Documentation (Swagger):** [surl.runmydocker-app.com/swagger-ui.html](https://surl.runmydocker-app.com/swagger-ui.html)
- **Backend Repository:** [github.com/elad9219/tinyurl](https://github.com/elad9219/tinyurl)
- **Frontend Repository:** [github.com/elad9219/tinyurl-frontend](https://github.com/elad9219/tinyurl-frontend)

## Highlights

- **URL shortening:** Creates compact URLs and redirects visitors to the original destination.
- **Fast URL resolution:** Uses Redis for short-code-to-URL lookup.
- **User and URL metadata:** Stores user data and URL metadata in MongoDB.
- **Click analytics:** Stores click history in Cassandra and exposes per-user and per-URL statistics.
- **URL normalization:** Normalizes submitted URLs for consistent storage and redirection.
- **Responsive frontend:** React interface for creating users, shortening URLs, and viewing analytics.
- **Dockerized backend:** Supports containerized deployment.

## Storage Design

| Store | Responsibility |
| --- | --- |
| Redis | Fast URL lookup / redirect mapping |
| MongoDB | User data and short-URL metadata |
| Cassandra | Click-history and analytics data |

## Technologies

- **Backend:** Java 11, Spring Boot, Maven
- **Frontend:** React, TypeScript, Node.js, npm
- **Databases:** MongoDB, Redis, Cassandra
- **Containerization:** Docker
- **Deployment:** Render / Vercel
- **Other:** Jackson, SLF4J, Git, GitHub

## Screenshots

### Homepage

![TinyURL homepage](https://github.com/user-attachments/assets/c916cdad-9119-4bf8-a83a-d61f7d8281b1)

### Create User

![Create user](https://github.com/user-attachments/assets/67949b52-39d6-48d0-b4da-74335b70bd20)

### Create Tiny URL

![Create tiny URL](https://github.com/user-attachments/assets/2a9b3d41-79b9-4d93-a670-6cd3681eceb3)

### User Information

![User information](https://github.com/user-attachments/assets/d56d8e5e-863f-42fd-89b4-38e5f152a494)

### Click Details

![Click details](https://github.com/user-attachments/assets/808bbdae-e858-4eeb-b320-75d86866bfd8)

## Usage

1. Create a user.
2. Submit a long URL to generate a shortened URL.
3. Open the shortened URL to be redirected to the original destination.
4. View user-level URL and click statistics.
5. Inspect click history for individual shortened URLs.

## Local Setup

### Prerequisites

- Java 11
- Maven
- Node.js and npm
- MongoDB
- Redis
- Cassandra
- Docker (optional)
- Git

### Backend

```bash
git clone https://github.com/elad9219/tinyurl.git
cd tinyurl
```

Create your local configuration from `src/main/resources/application.properties.example`, then replace the placeholders with your own MongoDB, Redis, and Cassandra/Astra DB values.

```bash
mvn clean install
mvn spring-boot:run
```

> Never commit real database passwords, API keys, connection strings, or secure-connect credentials.

### Frontend

```bash
git clone https://github.com/elad9219/tinyurl-frontend.git
cd tinyurl-frontend
npm install
npm start
```

### Docker

After configuring the required database connections:

```bash
docker build -t tinyurl-backend .
docker run -p 8080:8080 tinyurl-backend
```

## Project Structure

### Backend

```text
src/main/java/com/handson/tinyurl/
├── config/
├── controller/
├── model/
├── repository/
├── service/
└── util/
```

### Frontend

```text
src/
├── components/
├── utils/
└── App.tsx
```

## Contact

- **Elad Tennenboim**
- **GitHub:** [elad9219](https://github.com/elad9219)
- **LinkedIn:** [linkedin.com/in/elad-tennenboim](https://www.linkedin.com/in/elad-tennenboim/)
- **Email:** elad9219@gmail.com
