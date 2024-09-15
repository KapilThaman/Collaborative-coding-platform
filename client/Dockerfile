# Step 1: Use an official Node.js runtime as a parent image
FROM node:18 AS build

# Step 2: Set the working directory in the container
WORKDIR /client

# Step 3: Copy package.json and package-lock.json files
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Build the application
RUN npm run build

# Step 7: Use a lightweight web server to serve the app
FROM nginx:alpine

# Step 8: Copy the build files to the Nginx directory
COPY --from=client /app/build /usr/share/nginx/html

# Step 9: Expose port 80 to be accessed externally
EXPOSE 80

# Step 10: Start Nginx
CMD ["nginx", "-g", "daemon off;"]
