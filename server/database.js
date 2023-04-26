const mongoose = require('mongoose');
require('dotenv').config();

async function connectToDatabase() {
   try {
     const dbHost = process.env.DB_HOST;
     const dbPort = process.env.DB_PORT;
     const dbName = process.env.DB_NAME;
     const dbUsername = process.env.DB_USERNAME;
     const dbPassword = process.env.DB_PASSWORD;
 
     const connectionString = `mongodb://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?retryWrites=true&w=majority`;
 
     await mongoose.connect(connectionString, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
     });
 
     console.log(`Connected to MongoDB at ${dbHost}:${dbPort}/${dbName}`);
   } catch (err) {
     console.log(`Error connecting to MongoDB: ${err}`);
     process.exit(1);
   }
 }

module.exports = {
   connectToDatabase
};
