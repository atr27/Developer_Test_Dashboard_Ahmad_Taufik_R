const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', reportRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});