# SpareWork

SpareWork is a full-stack web application built using **Vite, React, Material UI** for the frontend and **Node.js, Express** for the backend.

## Folder Structure

```
Sparework New/
│-- client/      # Frontend (React + Vite + Material UI)
│   ├── src/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── store/
│   │   ├── service/
│   │   ├── data/
│   │   ├── component/
│   │   ├── views/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   ├── .env  (Frontend environment variables)
│-- server/    # Backend (Node.js + Express)
│   ├── model/
│   ├── controller/
│   ├── route/
│   ├── .env  (Backend environment variables)
│   ├── index.js (Server entry point)
```

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or later recommended)
- **MongoDB** (for database)
- **Git** (optional but recommended)

## Backend Setup (Server)

1. Navigate to the server directory:
   ```sh
   cd Sparework\server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the `server/` folder and add the following:
   ```env
   MONGO_URI=mongodb://localhost:27017/SpareWorkProd
   PORT=5000
   JWT_TOKEN_KEY=secret
   SQUARE_ACCESS_TOKEN= your_square_access_token
   SQUARE_LOCATION_ID= your_square_location_id
   SMTP_USER=example@email.com
   SMTP_PASS=12345 67890 1234
   ```
4. Start the server:
   ```sh
   npm start
   ```
   The server will run at `http://localhost:5000`.

## Frontend Setup (Client)

1. Navigate to the client directory:
   ```sh
   cd ../client
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the `client/` folder and add the following:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the frontend:
   ```sh
   npm run dev
   ```
   The React app will be available at `http://localhost:5173` (default Vite port).

## Running the Application

1. Start the backend server:
   ```sh
   cd server && npm start
   ```
2. In a separate terminal, start the frontend:
   ```sh
   cd client && npm run dev
   ```
3. Open the browser and navigate to `http://localhost:5173` to see the application running.

## Additional Notes

- **Database**: Make sure MongoDB is running locally or use a cloud database service.
- **Environment Variables**: Keep your `.env` files secure and avoid committing them to GitHub.
- **Square Payments**: Replace `SQUARE_ACCESS_TOKEN` with a valid key for production.

## Deployment

### Frontend Deployment

The frontend can be deployed using the provided `deploy.sh` script. This script builds the React application and deploys the build output to a remote server via FTP using `lftp`.

**Prerequisites:**

- Ensure you have `lftp` installed on your system.
- Configure the `FTP_USER`, `FTP_PASS`, `FTP_HOST`, `FTP_PORT`, `REMOTE_TARGET_DIR`, and `LOCAL_BUILD_DIR` variables in the `client/deploy.sh` script according to your server's FTP details. **Note:** Storing passwords directly in scripts is not recommended for production environments. Consider using `.netrc` or `lftp` bookmarks for better security.
- Ensure your production environment variables are set in `client/.env.production`.

**Steps:**

1. Navigate to the client directory:
   ```sh
   cd client
   ```
2. Make the script executable (if necessary):
   ```sh
   chmod +x deploy.sh
   ```
3. Run the deployment script:
   ```sh
   ./deploy.sh
   ```
   The script will build the frontend and transfer the files to the remote server.

### Backend Deployment

Deploying the Node.js backend typically involves transferring the code to a server and running it using a process manager like PM2 or a service like systemd.

**General Steps:**

1. **Prepare the Server:** Ensure your server has Node.js, npm, and MongoDB installed and configured.
2. **Transfer Code:** Transfer your `server/` directory to the server using `scp`, `rsync`, or Git.
3. **Install Dependencies:** Navigate to the `server/` directory on the server and install dependencies:
   ```sh
   npm install --production
   ```
4. **Configure Environment Variables:** Create a `.env` file in the `server/` directory on the server with your production environment variables.
5. **Start the Backend:** Use a process manager like PM2 to keep your application running and manage restarts.

   ```sh
   # Install PM2 globally if not already installed
   npm install -g pm2

   # Start your application
   pm2 start index.js --name sparework-backend
   ```

   Alternatively, you can configure a systemd service or use a platform-specific deployment method.

6. **Configure a Reverse Proxy (Optional but Recommended):** Use a web server like Nginx or Apache to proxy requests to your Node.js application, handle SSL, and serve static files.
