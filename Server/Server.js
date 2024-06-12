import express from 'express';
import { Low, JSONFile } from 'lowdb';
import { nanoid } from 'nanoid';
import cors from 'cors';
import twilio from 'twilio';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Twilio configuration using environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;
const client = twilio(accountSid, authToken);

// Middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors());

// Set up the database
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

db.data = db.data || { users: [], transactions: [], otps: [] };

// Sample data initialization
const initializeData = async () => {
  if (db.data.users.length === 0) {
    db.data.users.push({ id: nanoid(), name: 'Ahmer', mobile: '+923001234567', balance: 20000.00, pin: '1234' });
    db.data.users.push({ id: nanoid(), name: 'John Doe', mobile: '+923350408438', balance: 15000.00, pin: '4321' });
    await db.write();
  }
};
initializeData();

// Middleware to authenticate user by mobile and pin
const authenticateUser = (req, res, next) => {
  const { mobile, pin } = req.body;
  const user = db.data.users.find(u => u.mobile === mobile && u.pin === pin);
  if (!user) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
  req.user = user;
  next();
};

// Encryption and Decryption functions
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (text) => {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Function to send OTP using Twilio Verify via WhatsApp
const sendOTP = async (mobile) => {
  return client.verify.services(verifySid)
    .verifications.create({ to: `whatsapp:${mobile}`, channel: 'whatsapp' });
};

// Function to verify OTP using Twilio Verify
const verifyOTP = async (mobile, otp) => {
  const verificationCheck = await client.verify.services(verifySid)
    .verificationChecks.create({ to: `whatsapp:${mobile}`, code: otp });
  return verificationCheck.status === 'approved';
};

// Generate and send OTP
app.post('/api/generate-otp', authenticateUser, async (req, res) => {
  try {
    await sendOTP(req.user.mobile);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Register a new user
app.post('/api/register', async (req, res) => {
  const { name, mobile, pin } = req.body;
  const existingUser = db.data.users.find(user => user.mobile === mobile);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this mobile number' });
  }
  const newUser = { id: nanoid(), name, mobile, balance: 0, pin };
  db.data.users.push(newUser);
  await db.write();
  res.status(201).json(newUser);
});

// Get user details
app.post('/api/users', authenticateUser, (req, res) => {
  res.json(req.user);
});

// Transfer money with OTP verification and encryption
app.post('/api/transfer', authenticateUser, async (req, res) => {
  const { receiverMobile, amount, otp } = req.body;
  try {
    const isVerified = await verifyOTP(req.user.mobile, otp);
    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const receiver = db.data.users.find(u => u.mobile === receiverMobile);

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    if (req.user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    req.user.balance -= amount;
    receiver.balance += amount;

    const transaction = {
      id: nanoid(),
      senderMobile: req.user.mobile,
      receiverMobile,
      amount,
      date: new Date().toISOString(),
      type: 'transfer'
    };

    const encryptedTransaction = encrypt(JSON.stringify(transaction));
    db.data.transactions.push(encryptedTransaction);
    await db.write();

    res.status(200).json({ message: 'Transfer successful', transaction: encryptedTransaction });
  } catch (error) {
    res.status(500).json({ message: 'Transaction failed', error: error.message });
  }
});

// Deposit money
app.post('/api/deposit', authenticateUser, async (req, res) => {
  const { amount } = req.body;

  req.user.balance += amount;

  const transaction = {
    id: nanoid(),
    senderMobile: 'system',
    receiverMobile: req.user.mobile,
    amount,
    date: new Date().toISOString(),
    type: 'deposit'
  };

  const encryptedTransaction = encrypt(JSON.stringify(transaction));
  db.data.transactions.push(encryptedTransaction);
  await db.write();

  res.status(200).json({ message: 'Deposit successful', transaction: encryptedTransaction });
});

// Withdraw money with OTP verification and encryption
app.post('/api/withdraw', authenticateUser, async (req, res) => {
  const { amount, otp } = req.body;
  try {
    const isVerified = await verifyOTP(req.user.mobile, otp);
    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (req.user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    req.user.balance -= amount;

    const transaction = {
      id: nanoid(),
      senderMobile: req.user.mobile,
      receiverMobile: 'system',
      amount,
      date: new Date().toISOString(),
      type: 'withdraw'
    };

    const encryptedTransaction = encrypt(JSON.stringify(transaction));
    db.data.transactions.push(encryptedTransaction);
    await db.write();

    res.status(200).json({ message: 'Withdrawal successful', transaction: encryptedTransaction });
  } catch (error) {
    res.status(500).json({ message: 'Withdrawal failed', error: error.message });
  }
});

// Get transaction history
app.post('/api/transactions', authenticateUser, (req, res) => {
  const encryptedTransactions = db.data.transactions.filter(
    t => {
      const transaction = JSON.parse(decrypt(t));
      return transaction.senderMobile === req.user.mobile || transaction.receiverMobile === req.user.mobile;
    }
  );
  const transactions = encryptedTransactions.map(t => JSON.parse(decrypt(t)));
  res.json(transactions);
});

app.listen(port, () => {
  console.log(`Fake Pay API listening at http://localhost:${port}`);
  console.log(`Open http://localhost:${port} in your browser to view the application.`);
});
