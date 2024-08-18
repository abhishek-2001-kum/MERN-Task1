const express = require('express');
const mongoose = require('mongoose');
const transactionRoutes = require('./routes/transaction');
const app = express();

app.use(express.json());
app.use('/api', transactionRoutes);

mongoose.connect('mongodb://localhost:27017/transactionDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    app.listen(5000, () => {
        console.log('Server is running on port 5000');
    });
}).catch(err => console.error(err));
