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
}); 


app.post('/searches', (req, res) => {

  const url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.search}:${req.body.name}`;
  console.log(req.body);
  superagent.get(url)
    .then(results => {
      const books = results.body.items.map(book => new Book(book));
      console.log(books);
      // need to make the books and pass them in
      res.render('pages/searches/show.ejs', {books: books}); // need to pass in the books from the constructor
    }).catch(error => {
      res.render('/error.ejs');
      console.log(error);
    });
});

function Book(bookResults){
  this.img = bookResults.volumeInfo.imageLinks ? bookResults.volumeInfo.imageLinks.smallThumbnail: "https://i.imgur.com/J5LVHEL.jpg";
  this.bookTitle = bookResults.volumeInfo.title;
  this.authors = bookResults.volumeInfo.authors;
  this.description = bookResults.volumeInfo.description;
}




app.listen(PORT, () => console.log(`up on http://localhost:${PORT}`));