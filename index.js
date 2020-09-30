const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ey4wq.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 8000;



const app = express()

app.use(cors());
app.use(bodyParser.json());




const serviceAccount = require("./configs/burj-al-arab-test-firebase-adminsdk-1nzyy-88baa49429.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    console.log("db connection established");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        // console.log(req.body);
        bookings.insertOne(newBooking)
            .then(res => {
                res.send(res.insertedCount > 0);
            })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send('unauthorized access');
                    }

                })
                .catch(function (error) {
                    res.status(401).send('unauthorized access');
                });

        }
        else {
            res.status(401).send('unauthorized access');
        }




    })


});




app.listen(port);