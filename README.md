### React Media Player

## Dependencies

Run the following command to install all dependencies:

```
npm i react dotenv express multer cors react-router-dom
npm i -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p  
```

## How to run locally

1. Create a local file `.env` in the root directory with the following content:

   ```
   REACT_APP_SERVER_URL=http://localhost
   REACT_APP_PORT=5000
   ```

1. Open two terminals run the following commands in each:
   ```
   cd server
   node server.js
   ```
   ```
   npm start
   ```
