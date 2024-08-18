// Fetch and Seed Data

const express = require('express');
const axios = require('axios');
const Transaction = require('../models/transaction');
const router = express.Router();

router.get('/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        await Transaction.deleteMany(); // Clear existing data
        await Transaction.insertMany(transactions);

        res.status(200).json({ message: 'Database initialized with seed data' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


// List Transactions

router.get('/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        await Transaction.deleteMany(); // Clear existing data
        await Transaction.insertMany(transactions);

        res.status(200).json({ message: 'Database initialized with seed data' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


// Statistics API

router.get('/transactions', async (req, res) => {
    const { page = 1, perPage = 10, search = '' } = req.query;
    const query = {
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { price: { $regex: search, $options: 'i' } }
        ]
    };

    try {
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Create the Bar Chart API

router.get('/statistics', async (req, res) => {
    const { month } = req.query;
    const monthIndex = new Date(Date.parse(`${month} 1, 2023`)).getMonth() + 1;

    try {
        const transactions = await Transaction.find({
            dateOfSale: {
                $gte: new Date(`2023-${monthIndex}-01`),
                $lt: new Date(`2023-${monthIndex + 1}-01`)
            }
        });

        const totalSaleAmount = transactions.reduce((acc, curr) => acc + curr.price, 0);
        const totalSoldItems = transactions.filter(t => t.isSold).length;
        const totalNotSoldItems = transactions.length - totalSoldItems;

        res.status(200).json({
            totalSaleAmount,
            totalSoldItems,
            totalNotSoldItems
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Create the Pie Chart API

router.get('/barchart', async (req, res) => {
    const { month } = req.query;
    const monthIndex = new Date(Date.parse(`${month} 1, 2023`)).getMonth() + 1;

    try {
        const transactions = await Transaction.find({
            dateOfSale: {
                $gte: new Date(`2023-${monthIndex}-01`),
                $lt: new Date(`2023-${monthIndex + 1}-01`)
            }
        });

        const priceRanges = {
            "0-100": 0,
            "101-200": 0,
            "201-300": 0,
            "301-400": 0,
            "401-500": 0,
            "501-600": 0,
            "601-700": 0,
            "701-800": 0,
            "801-900": 0,
            "901-above": 0,
        };

        transactions.forEach(transaction => {
            const price = transaction.price;
            if (price <= 100) priceRanges["0-100"]++;
            else if (price <= 200) priceRanges["101-200"]++;
            else if (price <= 300) priceRanges["201-300"]++;
            else if (price <= 400) priceRanges["301-400"]++;
            else if (price <= 500) priceRanges["401-500"]++;
            else if (price <= 600) priceRanges["501-600"]++;
            else if (price <= 700) priceRanges["601-700"]++;
            else if (price <= 800) priceRanges["701-800"]++;
            else if (price <= 900) priceRanges["801-900"]++;
            else priceRanges["901-above"]++;
        });

        res.status(200).json(priceRanges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Create the Combined Data API

router.get('/piechart', async (req, res) => {
    const { month } = req.query;
    const monthIndex = new Date(Date.parse(`${month} 1, 2023`)).getMonth() + 1;

    try {
        const transactions = await Transaction.aggregate([
            {
                $match: {
                    dateOfSale: {
                        $gte: new Date(`2023-${monthIndex}-01`),
                        $lt: new Date(`2023-${monthIndex + 1}-01`)
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        const categories = transactions.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



router.get('/combined', async (req, res) => {
    const { month } = req.query;

    try {
        // Fetch data from each API
        const [barChartData, pieChartData, statisticsData] = await Promise.all([
            axios.get(`http://localhost:5000/api/barchart?month=${month}`),
            axios.get(`http://localhost:5000/api/piechart?month=${month}`),
            axios.get(`http://localhost:5000/api/statistics?month=${month}`)
        ]);

        // Combine the data into one response
        const combinedData = {
            barChart: barChartData.data,
            pieChart: pieChartData.data,
            statistics: statisticsData.data
        };

        res.status(200).json(combinedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// You can test the APIs using tools like Postman
// Bar Chart: GET http://localhost:5000/api/barchart?month=July
// Pie Chart: GET http://localhost:5000/api/piechart?month=July
// Combined Data: GET http://localhost:5000/api/combined?month=July
