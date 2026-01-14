# ---- Base image ----
FROM node:20-alpine

# ---- App directory ----
WORKDIR /app

# ---- Install deps first (better cache) ----
COPY package*.json ./
RUN npm install

# ---- Copy source ----
COPY . .

# ---- Build TypeScript ----
RUN npm run build

# ---- Expose port ----
EXPOSE 3000

# ---- Start app ----
CMD ["node", "dist/index.js"]
