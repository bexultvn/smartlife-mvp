FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist .
COPY --from=build /app/pages ./pages
COPY --from=build /app/styles.css .
COPY --from=build /app/public ./public

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
