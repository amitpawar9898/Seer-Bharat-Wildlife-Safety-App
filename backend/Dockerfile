FROM node:22-bookworm-slim

WORKDIR /app

# better-sqlite3 is a native module. Keep the compiler available so npm can
# build it when a prebuilt binary is not available for the container runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/data/seer_bharat.db
EXPOSE 4000

CMD ["npm", "start"]
