const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = "mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_URI + "/"+process.env.DB_NAME+"?retryWrites=true&w=majority";

console.log(uri);
// const uri = 'mongodb://fyoutub7:'+ process.env.DB_PASSWORD + '@ac-zso3jtk-shard-00-00.kl8qt2p.mongodb.net:27017,ac-zso3jtk-shard-00-01.kl8qt2p.mongodb.net:27017,ac-zso3jtk-shard-00-02.kl8qt2p.mongodb.net:27017/'+process.env.DB_NAME+'?ssl=true&replicaSet=atlas-iwlbia-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0'

const connectDatabase = () => {
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log("Mongo DB Connected");
        }).catch((error) => {
            console.log(error);
        });
}

module.exports = connectDatabase;
