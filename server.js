'use strict';
// 🏍 get all of your packages and turn them into const's
const express = require('express');
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
// 🗺 setting up the local env variables 
const app = express();
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
client.on('error', error => console.log(error));
// 🚀 here is where you set up the settings for the packages
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
// 🎌 routes go below here
app.get('/', homeGet);
app.get('/books/:id', bookIdGet);
app.post('/books', booksPost);
app.get('/searches/new', renderSearchSelectionPage); 
app.post('/searches', postSearches);
app.put('/books/:id', putBook);
app.delete('/books/:id', deleteBook);
// ✈ functions for routes go below here
function homeGet(req, res){
  const sqlString = 'SELECT * FROM book;';
  client.query(sqlString).then(result => {
    res.render('pages/index.ejs', {books: result.rows});
  }).catch(error => {
    res.render('pages/error.ejs');
    console.log(error);
  });
}
function bookIdGet(req, res){
  const sqlString = 'SELECT * FROM book WHERE id = $1'
  const sqlArr = [req.params.id];
  client.query(sqlString, sqlArr).then(result => {
    const ejsObject = {books: result.rows[0]};
    res.render('pages/books/detail.ejs', ejsObject);
  }).catch(error => {
    res.render('pages/error.ejs');
    console.log(error);
  });
}
function booksPost(req, res){
  const sqlString = 'INSERT INTO book (img, bookTitle, authors, book_description, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING id';
  const sqlArray = [req.body.img, req.body.bookTitle, req.body.authors, req.body.book_description, req.body.isbn];
  client.query(sqlString, sqlArray).then(result => {
    const ejsObject = {books: req.body};
    ejsObject.books.id = result.rows[0].id;
    res.render('pages/books/detail.ejs', ejsObject);
  }).catch(error => {
    res.render('pages/error.ejs');
    console.log(error);
  });
}
function renderSearchSelectionPage(req, res){
  res.render('pages/searches/new.ejs');
}
function postSearches(req, res){
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
}
function deleteBook(req, res){
  const sqlString = 'DELETE FROM book WHERE id=$1;';
  const sqlArr = [req.params.id];
  client.query(sqlString, sqlArr).then(result => {
    res.redirect('/');
  }).catch(error => {
    res.render('pages/error.ejs');
    console.log(error);
  });
}
function putBook(req, res){
  const sqlString = 'UPDATE book SET img=$1, bookTitle=$2, authors=$3, book_description=$4, isbn=$5 WHERE id=$6;';
  const sqlArr = [req.body.img, req.body.bookTitle, req.body.authors, req.body.book_description, req.body.isbn, req.params.id];
  client.query(sqlString, sqlArr).then(result => {
    res.redirect(`/books/${req.params.id}`);
  }).catch(error => {
    res.render('pages/error.ejs');
    console.log(error);
  });
}
function Book(bookResults){
  this.img = bookResults.volumeInfo.imageLinks ? bookResults.volumeInfo.imageLinks.smallThumbnail: "https://i.imgur.com/J5LVHEL.jpg";
  this.bookTitle = bookResults.volumeInfo.title;
  this.authors = bookResults.volumeInfo.authors ? bookResults.volumeInfo.authors.reduce((acc, curr) => {
    acc += (', ' + curr);
    return acc;
  }, '').slice(2) : 'No Authors Available'
  this.book_description = bookResults.volumeInfo.description ? bookResults.volumeInfo.description : 'Sorry, no description available.';
  this.isbn = bookResults.volumeInfo.industryIdentifiers ? bookResults.volumeInfo.industryIdentifiers[0].identifier : 'No ISBN Available' ;
}
// 🌌 make sure you start up your server before you do anything!!
client.connect().then(() => {
  app.listen(PORT, () => console.log(`up on http://localhost:${PORT}`));
});
