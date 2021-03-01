'use strict';

const express = require('express');
require('dotenv').config();
const superagent = require('superagent');


const app = express();
const PORT = process.env.PORT;

app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  const ejsObject = {teacher: 'nicholas', course: '301d71'};
  res.render('pages/index.ejs', ejsObject);
});

app.get('/hello', (req, res) => {
  const ejsObject = {teacher: 'nicholas', course: '301d71'};
  res.render('pages/index.ejs', ejsObject)
});

app.get('/searches/new', (req, res) => {
  console.log(req.query);
  res.render('pages/searches/new.ejs');
})



app.listen(PORT, () => console.log(`up on http://localhost:${PORT}`));