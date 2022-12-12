const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const SECRET_KEY = process.env.JWT;

const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: STRING,
});

Note.belongsTo(User);
User.hasMany(Note);

User.byToken = async (token) => {
  try {
    const verifyUser = jwt.verify(token, SECRET_KEY);
    return verifyUser;
  } catch (err) {
    throw err;
  }
  // try {
  // const user = await User.findByPk(token);
  //   if (verifyUser) {
  //     console.log('Passed if in byToken method');
  //     return verifyUser;
  //   }
  //   const error = Error('bad credentials');
  //   error.status = 401;
  //   throw error;
  // } catch (ex) {
  //   const error = Error('bad credentials');
  //   error.status = 401;
  //   throw error;
  // }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  // console.log('Authenticate | user.password: ', user.password);
  // console.log('Authenticate | password: ', password);

  const passwordValid = await bcrypt.compare(password, user.password);

  // console.log('PASSWORDVALID: ', passwordValid);
  if (passwordValid) {
    // console.log('User.id: ', user.id);
    // console.log('User.username: ', user.username);
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY
    );
    // console.log('TOKEN: ', token);
    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const notes = [
    { text: 'Quick brown fox' },
    { text: 'Jumps over the fence' },
    { text: 'test test test test' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const [note1, note2, note3] = await Promise.all(
    notes.map((note) => Note.create(note))
  );
  note1.setUser(lucy);
  note2.setUser(moe);
  note3.setUser(larry);
  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      note1,
      note2,
      note3,
    },
  };
};

User.beforeCreate(async (user) => {
  const SALT_COUNT = 5;
  const hashedPassword = await bcrypt.hash(user.password, SALT_COUNT);
  console.log('HASHEDPW: ', hashedPassword);
  user.password = hashedPassword;
  console.log('user.password: ', user.password);
});

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
