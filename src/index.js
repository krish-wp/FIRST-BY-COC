import dotenv from "dotenv";
import coonnectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

coonnectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running at port : ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log("DATABASE CONNECTION ERROR !!!", error);
    });

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
