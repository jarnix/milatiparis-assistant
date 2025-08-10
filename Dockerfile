FROM node:18-alpine

ARG DOTENV_PRIVATE_KEY
RUN echo "Using key: $DOTENV_PRIVATE_KEY"

WORKDIR /app

# Accept build argument for DOTENV_PRIVATE_KEY
ENV DOTENV_PRIVATE_KEY=$DOTENV_PRIVATE_KEY

# Install dependencies and dotenvx
RUN apk add --no-cache libc6-compat && \
    npm install -g @dotenvx/dotenvx

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy the standalone output to app root
RUN cp -r .next/standalone/* ./
# The .next/static directory is already in the right place, no need to copy
# Copy public directory if it exists
RUN if [ -d "public" ]; then cp -r public ./public; fi

# Create user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["dotenvx", "run", "-f .env.production", "--", "node", "server.js"]