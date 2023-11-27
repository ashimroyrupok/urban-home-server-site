require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000





app.use(cors({
    origin: [
        "http://localhost:5173"
    ],
    credentials: true
}))

app.use(express.json())

// console.log(process.env.DB_USER);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwnroha.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {


        const usersCollection = client.db('urbanDB').collection('users')
        const reviewsCollection = client.db('urbanDB').collection('reviews')
        const PropertiesCollection = client.db('urbanDB').collection('properties')



        // properties related api

        app.post('/properties', async (req, res) => {
            const data = req.body;
            const result = await PropertiesCollection.insertOne(data)
            res.send(result)
        })

        app.get('/properties', async (req, res) => {
            const result = await PropertiesCollection.find().toArray()
            res.send(result)
        })

        app.get('/properties/:status', async(req,res) => {
            const data = req.params.status;
            console.log(data);
            const query = {status: data}
            const result = await PropertiesCollection.find(query).toArray()
            res.send(result)
        })

        app.patch('/properties/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            const query= { _id: new ObjectId(id) }
            const updatedDoc = {
                $set:{
                    status: data?.status
                }
            }
            const result = await PropertiesCollection.updateOne(query,updatedDoc)
            res.send(result)
        })

        // users related api

        app.patch('/users/:email', async (req, res) => {
            const email = req.params.email;
            const data = req.body
            console.log(data, email);
            const filter = { email: email }
            const docData = {
                $set: {
                    role: data.role
                }
            }
            const result = await usersCollection.updateOne(filter, docData)
            res.send(result)
        })

        app.delete('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const data = req.body;
            const query = { email: data?.email }
            const existingUser = await usersCollection.findOne(query)
            if (existingUser) {
                return res.send({ user: "user is already exist", insertedId: null })
            }
            const result = await usersCollection.insertOne(data)
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        // reviews

        app.delete('/reviews/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await reviewsCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })




        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', async (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`server is running on ${port}`);
})