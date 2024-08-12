# Use the official Node.js image.
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install


# Install nodemon globally
RUN npm install -g nodemon

# Copy the rest of the application code
COPY . .

# Expose the ports the app runs on
EXPOSE 3000

# Define the command to run the application
CMD [ "npm", "run", "start" ]
