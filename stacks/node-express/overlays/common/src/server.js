const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./db');
{{AUTH_REQUIRE}}

const app = express();
const PORT = process.env.PORT || {{PORT}};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

connectDB();

// API Endpoints
{{AUTH_MOUNT}}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: {{APP_TITLE_JS}},
    database: '{{DB_TYPE}}',
    express: require('express/package.json').version,
    auth: {{AUTH_ENABLED}}
  });
});

app.listen(PORT, () => {
  console.log(`⚡ Server listening at http://localhost:${PORT}`);
});
