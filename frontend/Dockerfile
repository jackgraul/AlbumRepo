# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build && echo "new build"

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]