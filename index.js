const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./utils/dbConnection'); 
const publicApiRoutes = require('./routes/publicApiRoutes');
 

 
connectDatabase();
 

const app = express ();
app.use(cors({
    origin: "*", // Replace with your allowed origins
}));
app.use(express.json());
const PORT = process.env.PORT || 3000;
 

app.use("/gundy/api/v1",  publicApiRoutes);


 
app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});