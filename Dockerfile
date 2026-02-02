FROM node:20-alpine

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies
RUN npm ci --workspaces --include-workspace-root

# Copy source code
COPY . .

# Build everything (shared types, client, server, then copy client to server/dist/public)
RUN npm run build:all

# Create data directory for database persistence
RUN mkdir -p /data

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/database.db
ENV CERT_DIR=/data

EXPOSE 3000

CMD ["npm", "start"]
