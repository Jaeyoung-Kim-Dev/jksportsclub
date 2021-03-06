/*import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';*/
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient } = require('mongodb');
const defaultClubs = require('./defaultClubs');

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', {
      useNewUrlParser: true,
    });
    const db = client.db('jksportsclub');

    await operations(db);

    await client.close();
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to db', error });
  }
};

app.get('/api/clubs/:initials', async (req, res) => {
  withDB(async (db) => {
    const clubInitials = req.params.initials;

    const clubInfo = await db
      .collection('clubs')
      .findOne({ initials: clubInitials });
    res.status(200).json(clubInfo);
  }, res);
});

app.post('/api/clubs/:initials/upvote', async (req, res) => {
  withDB(async (db) => {
    const clubInitials = req.params.initials;

    const clubInfo = await db
      .collection('clubs')
      .findOne({ initials: clubInitials });
    await db.collection('clubs').updateOne(
      { initials: clubInitials },
      {
        $set: {
          upvotes: clubInfo.upvotes + 1,
        },
      }
    );

    const updatedclubInfo = await db
      .collection('clubs')
      .findOne({ initials: clubInitials });
    res.status(200).json(updatedclubInfo);
  }, res);
});

app.post('/api/clubs/:initials/downvote', async (req, res) => {
  withDB(async (db) => {
    const clubInitials = req.params.initials;

    const clubInfo = await db
      .collection('clubs')
      .findOne({ initials: clubInitials });
    await db.collection('clubs').updateOne(
      { initials: clubInitials },
      {
        $set: {
          upvotes: clubInfo.upvotes - 1,
        },
      }
    );

    const updatedclubInfo = await db
      .collection('clubs')
      .findOne({ initials: clubInitials });
    res.status(200).json(updatedclubInfo);
  }, res);
});

app.post('/api/clubs/:initials/add-review', (req, res) => {
  const { username, registerDate, text } = req.body;
  const clubInitials = req.params.initials;

  withDB(async (db) => {
    const clubInfo = await db
      .collection('clubs')
      .findOne({ initials: clubInitials });
    await db.collection('clubs').updateOne(
      { initials: clubInitials },
      {
        $set: {
          //reviews: {username: 1, text: 2},
          reviews: clubInfo.reviews.concat({ username, registerDate, text }),
          //reviews: 'test',
        },
      }
    );

    const updatedclubInfo = await db
      .collection('clubs')
      .findOne({ initials: clubInitials });
    res.status(200).json(updatedclubInfo);
  }, res);
});

app.get('/api/management', async (req, res) => {
  withDB(async (db) => {
    //const members = await db.collection('members').findOne({});
    //res.status(200).json(members);
    //await db.collection('clubs').drop();
    await db.createCollection('clubs11');
    res.status(200).send('Done');
  }, res);
});

app.post('/api/resetdb', (req, res) => {
  withDB((db) => {
    db.collection('clubs').drop();
    db.createCollection('clubs');
    db.collection('clubs').insertMany(defaultClubs);

    res.sendStatus(200);
  }, res);
});

// all of requests that aren't caught by any of other API routes should be passes on to the app.
// It allows the client site app to navigate between pages and process urls correctly.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on  port 8000'));
