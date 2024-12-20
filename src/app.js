const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Node.js Docker App By Nanit!',
        timestamp: new Date()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Healthy' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
