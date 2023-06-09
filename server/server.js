const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./database');

const app = express();

app.use(cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/channels', require('./routes/channel'));
app.use('/api/servers', require('./routes/server'));
app.use('/api/friend', require('./routes/friend'));
app.use('/api/block', require('./routes/block'));


// Connect to database
connectToDatabase();

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
