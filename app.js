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

const requireToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    req.user = user;
    // console.log('REQ.USER: ', req.user);
    next();
  } catch (err) {
    next(err);
  }
};

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

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/users/:id/notes', requireToken, async (req, res, next) => {
  // const verifyUser = await User.byToken(req.headers.authorization);
  // console.log('VERIFYUSER ID: ', verifyUser.id);
  // console.log('req.params.id: ', +req.params.id);
  if (req.user.id === +req.params.id) {
    try {
      const notes = await Note.findAll({
        where: {
          userId: req.user.id,
        },
      });
      res.send(notes);
    } catch (err) {
      next(err);
    }
  } else {
    res.status(401).send('bad credentials');
  }
});

// error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
