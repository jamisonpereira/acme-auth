const express = require('express');
const app = express();
const {
  models: { User, Note },
} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');
const { verify } = require('crypto');
require('dotenv').config();

// middleware
app.use(express.json());

// routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    console.log('REQ.BODY: ', req.body);
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/users/:id/notes', async (req, res, next) => {
  const verifyUser = await User.byToken(req.headers.authorization);
  console.log('VERIFYUSER ID: ', verifyUser.id);
  console.log('req.params.id: ', +req.params.id);
  if (verifyUser.id === +req.params.id) {
    try {
      console.log('ENTERED API');
      const notes = await Note.findAll({
        where: {
          userId: req.params.id,
        },
      });
      console.log('NOTES FROM API: ', notes);
      res.send(notes);
    } catch (err) {
      next(err);
    }
  } else {
    res.status(401).send('bad credentials');
  }
});

app.get('/api/auth', async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

// error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
