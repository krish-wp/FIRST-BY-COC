// require('dotenv').config(path: '/.env')
import dotenv from 'dotenv'
import coonnectDB from './db/index.js';

dotenv.config(
    {path: './env'}
)


coonnectDB();

























// 1st method


// (async () => {
//     try {
//         await mongoos.connect(`${process.env.MONGODB_URL}/${DB_name}`)

//         app.on("error",() => {
//             console.log("Error",error);
//             throw error
//         })

//         app.listen(process.env.PORT , () => {
//             console.log(`listning on port number ${process.env.PORT}`)
//         })

//     } catch (error) {
//         console.error("Error connecting to the database:", error);
//         throw error;
//     }
// }) ()