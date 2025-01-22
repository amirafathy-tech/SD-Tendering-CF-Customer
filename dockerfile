# Stage 1: Build the Angular app
FROM node:20 as builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install -g npm@10.2.5

RUN npm install -g @angular/cli

# Copy the project files
COPY . .

# Build the Angular app
RUN npm run build


# Expose the default HTTP port
EXPOSE 8080
CMD ng serve --host=0.0.0.0  --disable-host-check 