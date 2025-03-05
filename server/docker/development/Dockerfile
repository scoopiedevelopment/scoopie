# Use the Node.js base image
FROM node:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json, package-lock.json, and nodemon.json to the working directory
COPY package*.json ./
COPY nodemon.json ./

# Install dependencies
RUN npm install

# Copy tsconfig files
COPY tsconfig.json ./
COPY ../../tsconfig.json ../

# Copy the rest of the application code to the working directory
COPY . .

# Install global dependencies
RUN npm install -g cross-env nodemon

# Expose the port the app runs on
EXPOSE 5000

# Command to run the app
CMD ["npm", "run", "dev"]