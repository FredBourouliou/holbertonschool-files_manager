# Files Manager

A back-end application built with Node.js, Express, MongoDB, and Redis that provides a simple platform to upload and view files with user authentication.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Technologies](#technologies)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Authors](#authors)
- [License](#license)

## Description

This project is a summary of the back-end trimester covering:

- **Authentication**: User authentication via tokens
- **NodeJS**: Server-side JavaScript runtime
- **MongoDB**: NoSQL database for persistent data storage
- **Redis**: In-memory data store for caching and temporary data
- **Background Processing**: Asynchronous task processing with Bull

The application allows users to:
- Authenticate via a token
- List all files
- Upload new files
- Change file permissions
- View files
- Generate thumbnails for images

## Features

- User authentication with SHA1 password hashing
- Token-based session management stored in Redis
- File upload with support for folders, files, and images
- File permission management (public/private)
- Automatic thumbnail generation for images
- Background worker for processing tasks
- RESTful API design

## Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x.x | JavaScript runtime |
| Express | 4.17.1 | Web framework |
| MongoDB | 3.5.9 | Database |
| Redis | 2.8.0 | Caching & sessions |
| Bull | 3.16.0 | Background jobs |
| Babel | 7.8.0 | ES6+ transpilation |
| Mocha | 9.0.0 | Testing framework |
| ESLint | 6.8.0 | Code linting |

## Requirements

- Ubuntu 20.04 LTS
- Node.js v20.x.x
- MongoDB v4.x
- Redis v6.x
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/holbertonschool-files_manager.git
   cd holbertonschool-files_manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB**
   ```bash
   # On Ubuntu
   sudo systemctl start mongod

   # On macOS with Homebrew
   brew services start mongodb-community
   ```

4. **Start Redis**
   ```bash
   # On Ubuntu
   sudo systemctl start redis-server

   # On macOS with Homebrew
   brew services start redis
   ```

5. **Start the server**
   ```bash
   npm run start-server
   ```

6. **Start the background worker** (in a separate terminal)
   ```bash
   npm run start-worker
   ```

## Configuration

The application uses environment variables for configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `DB_HOST` | localhost | MongoDB host |
| `DB_PORT` | 27017 | MongoDB port |
| `DB_DATABASE` | files_manager | MongoDB database name |
| `FOLDER_PATH` | /tmp/files_manager | File storage path |

Example:
```bash
export PORT=5000
export DB_HOST=localhost
export DB_PORT=27017
export DB_DATABASE=files_manager
export FOLDER_PATH=/tmp/files_manager
```

## Usage

### Starting the Application

```bash
# Development mode with hot reload
npm run start-server

# Start background worker
npm run start-worker

# Run a specific file
npm run dev <filename.js>
```

### Example API Calls

```bash
# Check Redis status
curl http://localhost:5000/status

# Get statistics
curl http://localhost:5000/stats

# Create a new user
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Authenticate
curl -X GET http://localhost:5000/connect \
  -H "Authorization: Basic <base64(email:password)>"

# Upload a file
curl -X POST http://localhost:5000/files \
  -H "X-Token: <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "myfile.txt", "type": "file", "data": "SGVsbG8gV29ybGQh"}'
```

## API Endpoints

### Status & Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Check if Redis and MongoDB are alive |
| GET | `/stats` | Get number of users and files |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a new user |
| GET | `/users/me` | Get current user info |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/connect` | Sign in and get auth token |
| GET | `/disconnect` | Sign out |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/files` | Upload a new file |
| GET | `/files/:id` | Get file by ID |
| GET | `/files` | List all files (with pagination) |
| PUT | `/files/:id/publish` | Make file public |
| PUT | `/files/:id/unpublish` | Make file private |
| GET | `/files/:id/data` | Get file content |

## Project Structure

```
holbertonschool-files_manager/
├── controllers/
│   ├── AppController.js      # Status and stats endpoints
│   ├── AuthController.js     # Authentication logic
│   ├── FilesController.js    # File operations
│   └── UsersController.js    # User management
├── routes/
│   └── index.js              # Route definitions
├── utils/
│   ├── db.mjs                # MongoDB client utility
│   └── redis.mjs             # Redis client utility
├── tests/
│   └── ...                   # Test files
├── .eslintrc.cjs             # ESLint configuration
├── .gitignore                # Git ignore rules
├── babel.config.js           # Babel configuration
├── package.json              # Project dependencies
├── README.md                 # Project documentation
├── server.js                 # Express server entry point
└── worker.js                 # Background worker entry point
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run linter
npm run lint

# Check specific files
npm run check-lint
```

### Test Coverage

Tests cover:
- Redis client functionality
- MongoDB client functionality
- API endpoints
- Authentication flow
- File operations

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start-server` | `npm run start-server` | Start Express server with nodemon |
| `start-worker` | `npm run start-worker` | Start background worker |
| `dev` | `npm run dev <file>` | Run a file with babel-node |
| `test` | `npm test` | Run Mocha tests |
| `lint` | `npm run lint` | Run ESLint |

## Error Handling

The API returns JSON responses with appropriate HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

Example error response:
```json
{
  "error": "Unauthorized"
}
```

## Authors

- **Frédéric Bourouliou** - [GitHub](https://github.com/fredericbourouliou)

## License

This project is part of the Holberton School curriculum.
