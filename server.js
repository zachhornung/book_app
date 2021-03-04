'use strict';

const express = require('express');
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
client.on('error', error => console.log(error));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  const sqlString = 'SELECT * FROM book;';
  client.query(sqlString).then(result => {
    res.render('pages/index.ejs', {books: result.rows});
  });
});

app.get('/books/:id', (req, res) => {
  const sqlString = 'SELECT * FROM book WHERE id = $1'
  const sqlArr = [req.params.id];
  client.query(sqlString, sqlArr).then(result => {
    const ejsObject = {books: result.rows[0]};
    res.render('pages/books/detail.ejs', ejsObject);
  });
});

app.post('/books', (req, res) => {
  const sqlString = 'INSERT INTO book (img, bookTitle, authors, book_description, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING id';
  const sqlArray = [req.body.img, req.body.bookTitle, req.body.authors, req.body.book_description, req.body.isbn];
  client.query(sqlString, sqlArray).then(result => {
    const ejsObject = {books: req.body};
    ejsObject.books.id = result.rows[0].id;
    res.render('pages/books/detail.ejs', ejsObject);
  });
});

app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new.ejs');
}); 

app.post('/searches', (req, res) => {
  const url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.search}:${req.body.name}`;
  superagent.get(url)
    .then(results => {
      const books = results.body.items.map(book => new Book(book));
      // need to make the books and pass them in
      res.render('pages/searches/show.ejs', {books: books}); // need to pass in the books from the constructor
    }).catch(error => {
      res.render('pages/error.ejs');
      console.log(error);
    });
});

app.put('/books/:id', (req, res) => {
  const sqlString = 'UPDATE book SET img=$1, bookTitle=$2, authors=$3, book_description=$4, isbn=$5 WHERE id=$6;';
  const sqlArr = [req.body.img, req.body.bookTitle, req.body.authors, req.body.book_description, req.body.isbn, req.params.id];
  client.query(sqlString, sqlArr).then(result => {
    res.redirect(`/books/${req.params.id}`);
  })
});

app.delete('/books/:id', (req, res) => {
  const sqlString = 'DELETE FROM book WHERE id=$1;';
  const sqlArr = [req.params.id];
  client.query(sqlString, sqlArr).then(result => {
    res.redirect('/');
  })
})

function Book(bookResults){
  this.img = bookResults.volumeInfo.imageLinks ? bookResults.volumeInfo.imageLinks.smallThumbnail: "https://i.imgur.com/J5LVHEL.jpg";
  this.bookTitle = bookResults.volumeInfo.title;
  this.authors = bookResults.volumeInfo.authors.reduce((acc, curr) => {
    acc += (', ' + curr);
    return acc;
  }, '').slice(2);
  this.book_description = bookResults.volumeInfo.description ? bookResults.volumeInfo.description : 'Sorry, no description available.';
  this.isbn = bookResults.volumeInfo.industryIdentifiers ? bookResults.volumeInfo.industryIdentifiers[0].identifier : 'No ISBN Available' ;
}

client.connect().then(() => {
  app.listen(PORT, () => console.log(`up on http://localhost:${PORT}`));
});
