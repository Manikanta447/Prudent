const express = require("express")
const {open} = require("sqlite")
const sqlite3 = require("sqlite3")
const path  = require("path")

const app = express()
app.use(express.json())

let dbPath = path.join(__dirname, 'prudent.db')
let db

const initializeDbAndServer = async () => {
    try{
        db = await open({filename: dbPath, driver: sqlite3.Database });
        app.listen(3000, () => {
            console.log("Server is running on port 3000")
        })
    }catch(error){
        console.log(error.message)
        process.exit(1)
    }
}

initializeDbAndServer()
console.log(db)

//Get Books API
app.get("/books", async (request, response) => {
    const getBook = `SELECT * FROM Books`
    const {page = 1, limit = 10} = request.query
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    const offset = (pageNum - 1) * limitNum
    const query = `
        SELECT * FROM Books
        LIMIT ${limitNum} OFFSET ${offset};
    `
    let books
    try{
        const result = await db.all(query)
        books = result
    }catch(error){
        console.log(error)
        response.status(500).send({message: 'Error fetching Books'})
    }
    response.send(books)
})

//post books
app.post('/books', async (request, response) => {
    const {title, author, genre, pages, publishedDate} = request.body
    const getAuthId = `
        SELECT author_id FROM Authors WHERE author_name LIKE (?);
    `
    let authorId = await db.get(getAuthId, author)
    if(!authorId){
        const insertAuthor = `
            INSERT INTO Authors (author_name) VALUES (?);
        `
        await db.run(insertAuthor, author)
        authorId = await db.get(getAuthId)
    }

    const getGenreId = `
        SELECT genre_id from Genres where name LIKE (?);
    `
    let genreId = await db.get(getGenreId, genre)
    if (!genreId) {
        const insertGenre = `
            INSERT INTO Genres (name) VALUES (?);
        `
        await db.run(insertGenre, genre)
        genreId = await db.get(getGenreId, genre)
        console.log(genreId)
    }
    const insertBook = `
        INSERT INTO Books (title, author_id, genre_id, pages, published_date) VALUES (?,?,?,?,?);
    `
    const result = await db.run(insertBook, [title, authorId.author_id, genreId.genre_id, pages, publishedDate])
    response.status(201).send({message: 'Book added successfully', id: result.lastID})
})

app.get('/authors', async (request, response) => {
    const getAuthors = `SELECT * FROM Authors`
    let authors
    try{
        const result = await db.all(getAuthors)
        authors = result
    }catch(error){
        console.log(error)
        response.status(500).send({message: 'Error fetching Authors'})
    }
    response.send(authors)
})

app.get(`/genres`, async (request, response) => {
    const getGenres = `SELECT * FROM Genres`
    let genres
    try{
        const result = await db.all(getGenres)
        genres = result
    }catch(error){
        console.log(error)
        response.status(500).send({message: 'Error fetching Genres'})
    }
    response.send(genres)
})

app.put('/books/:id/', async (request, response) => {
    const {id} = request.params
    const {title, author, genre, pages, publishedDate} = request.body
    const getAuthId = `
        SELECT author_id FROM Authors WHERE author_name LIKE (?);
    `
    let authorId = await db.get(getAuthId, author)
    if(!authorId){
        const insertAuthor = `
            INSERT INTO Authors (author_name) VALUES (?);
        `
        await db.run(insertAuthor, author)
        authorId = await db.get(getAuthId)
    }

    const getGenreId = `
        SELECT genre_id from Genres where name LIKE (?);
    `
    let genreId = await db.get(getGenreId, genre)
    if (!genreId) {
        const insertGenre = `
            INSERT INTO Genres (name) VALUES (?);
        `
        await db.run(insertGenre, genre)
        genreId = await db.get(getGenreId, genre)
        console.log(genreId)
    }

    const updateQuery = `
        update Books
        SET title =?, author_id =?, genre_id =?, pages =?, published_date =?
        WHERE 
            book_id =(?)
    `
    try{
        await db.run(updateQuery, [title, authorId.author_id, genreId.genre_id, pages, publishedDate, id])
        response.send({message: 'Book updated successfully'})
    }catch(error){
        response.status(500).send({message: 'Error updating book', error: error})
    }
    
})

app.delete('/books/:id/', async (request, response) =>{
    const {id} = request.params
    const deleteQuery = `
        DELETE FROM Books WHERE book_id =?;
    `
    await db.run(deleteQuery, id)
    response.send({message: 'Book deleted successfully'})
})
