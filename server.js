const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Database setup
const dbPromise = open({
  filename: './data/cards.db',
  driver: sqlite3.Database,
});


app.post('/get_card_status', async (req, res) => {
  try {
    const { phone_number, card_id } = req.body;

    if (!phone_number && !card_id) {
      return res.status(400).json({ error: 'Phone number or card ID is required.' });
    }

    const db = await dbPromise;

    let query, params;

    if (phone_number) {
      query = 'SELECT * FROM Users WHERE phone_number = ?';
      params = [phone_number];
    } else {
      query = 'SELECT * FROM Cards WHERE id = ?';
      params = [card_id];
    }

    const user = await db.get(query, params);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const card = await db.get('SELECT * FROM Cards WHERE user_id = ?', [user.id]);
    const statusHistory = await db.all('SELECT * FROM StatusHistory WHERE card_id = ?', [card.id]);

    res.json({
      status: card.courier_status,
      delivery_attempts: card.delivery_attempts,
      status_history: statusHistory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
