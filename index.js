require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const stripe = require('stripe')(process.env.DB_PAYMENT_SECRET)
const jwt = require('jsonwebtoken')
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



const verifyToken = async (req, res, next) => {
    console.log("inside verify token", req.headers?.authorization);

    if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
    }
    const token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, process.env.DB_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
    });
};

async function run() {
    try {


        const usersCollection = client.db('urbanDB').collection('users')
        const reviewsCollection = client.db('urbanDB').collection('reviews')
        const PropertiesCollection = client.db('urbanDB').collection('properties')
        const WishCollection = client.db('urbanDB').collection('wishlists')
        const soldCollection = client.db('urbanDB').collection('soldList')




        // JWT
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.DB_SECRET_KEY, { expiresIn: "3h" });
            res.send({ token });
        });


        // sold collection

        app.get('/sold/agent/:email', async (req, res) => {
            const email = req.params.email;
            const query = { agentEmail: email, status: "bought" }
            const result = await soldCollection.find(query).toArray()
            res.send(result)

        })

        app.post('/sold', async (req, res) => {
            const data = req.body;
            const result = await soldCollection.insertOne(data)
            res.send(result)
        })

        app.get('/soldList/:agentEmail', async (req, res) => {
            const agentEmail = req.params.agentEmail;
            const query = { agentEmail: agentEmail }
            const result = await soldCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/soldList/pay/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id,"id id");
            const query = { _id: new ObjectId(id) }
            const result = await soldCollection.findOne(query)
            res.send(result)
        })

        app.patch('/soldList/reject/:title', async (req, res) => {
            const title = req.params.title;
            console.log(title);
            const filter = { propertyTitle: title }
            const docData = {
                $set: {
                    status: "rejected"
                }
            }
            const result = await soldCollection.updateMany(filter, docData)
            res.send(result)
        })
        app.patch('/soldList/payment/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const docData = {
                $set: {
                    status: data.status,
                    transactionId: data.transactionId
                }
            }
            const result = await soldCollection.updateMany(filter, docData)
            res.send(result)
        })

        app.patch('/soldList/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const data = req.body;
            console.log(data, "dlsajfsjf");
            const query = { _id: new ObjectId(id) }
            const docData = {
                $set: {
                    status: data.status
                }
            }
            const result = await soldCollection.updateOne(query, docData)
            res.send(result)
        })

        app.get('/sold/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { buyerEmail: email }
            const result = await soldCollection.find(query).toArray()
            res.send(result)
        })



        // wishlists related api

        app.post('/wishlists', async (req, res) => {
            const data = req.body;
            const result = await WishCollection.insertOne(data)
            res.send(result)
        })

        app.get('/wishlists/:email', async (req, res) => {
            const email = req.params.email;
            const query = { buyerEmail: email }
            const result = await WishCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/wishlists/toBuy/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await WishCollection.findOne(query)
            res.send(result)
        })

        app.delete('/wishlists/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await WishCollection.deleteOne(query)
            res.send(result)
        })



        // properties related api

        app.get('/properties/advertisement', async (req, res) => {
            const query = { advertised: true }
            const result = await PropertiesCollection.find(query).toArray()
            res.send(result)
        })

        app.patch('/propertise/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: new ObjectId(id) }
            const docData = {
                $set: {
                    advertised: data.advertised
                }
            }
            const result = await PropertiesCollection.updateOne(query, docData)
            res.send(result)
        })

        app.get('/properties/verified',verifyToken, async (req, res) => {
            const query = { status: 'verified' }
            const data = req.query
            console.log(data);
            const options = {
                sort: {
                    minimumPrice: data.sort === 'asc' ? 1 : -1
                }
            }
            const result = await PropertiesCollection.find(query, options).toArray()
            res.send(result)
        })

        app.post('/properties', async (req, res) => {
            const data = req.body;
            const result = await PropertiesCollection.insertOne(data)
            res.send(result)
        })

        app.get('/properties', async (req, res) => {
            const result = await PropertiesCollection.find().toArray()
            res.send(result)
        })

        app.get('/property/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await PropertiesCollection.findOne(query)
            res.send(result)

        })

        app.get('/properties/:info', async (req, res) => {
            const data = req.params.info;
            console.log(data, "paramsdata");
            let query = { agentEmail: data }
            console.log("fast", query);
            let newKeyName = 'status';
            if (data === "verified" || data === "rejected") {
                query[newKeyName] = data
                delete query.agentEmail
            }

            console.log(query);
            const result = await PropertiesCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await PropertiesCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/properties/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: data?.status
                }
            }
            const result = await PropertiesCollection.updateOne(query, updatedDoc)
            res.send(result)
        })
        app.patch('/properties/bought/:title', async (req, res) => {
            const title = req.params.title
            const data = req.body
            // console.log(data);
            const query = { title: title }
            const updatedDoc = {
                $set: {
                    status: data?.status
                }
            }
            const result = await PropertiesCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        app.patch('/properties/fraud/:email', async (req, res) => {
            const email = req.params.email
            const data = req.body
            // console.log(data);
            const query = { agentEmail: email }
            const updatedDoc = {
                $set: {
                    status: data?.status
                }
            }
            const result = await PropertiesCollection.updateMany(query, updatedDoc)
            res.send(result)
        })


        app.patch('/properties/updateProperty/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            // console.log(data, "helloo");
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    image: data.image,
                    title: data?.title,
                    location: data?.location,
                    maximumPrice: data?.maximumPrice,
                    minimumPrice: data?.minimumPrice
                }
            }
            const result = await PropertiesCollection.updateOne(query, updatedDoc)
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
            const query = { reviewerName: email }
            const result = await reviewsCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/review/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await reviewsCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })
        app.get('/latestReview', async (req, res) => {
            const result = await reviewsCollection.find().sort({ date: -1 }).limit(4).toArray()
            res.send(result)
        })

        app.get('/reviews/property/:title', async (req, res) => {
            const title = req.params.title;
            const query = { reviewProperty: title }
            const result = await reviewsCollection.find(query).toArray()
            res.send(result)
        })



        app.get('/reviews/user/:name', async (req, res) => {
            const name = req.params.name;
            const query = { reviewerName: name }
            const result = await reviewsCollection.find(query).toArray()
            res.send(result)
        })



        app.post('/reviews', async (req, res) => {
            const data = req.body;
            const result = await reviewsCollection.insertOne(data)
            res.send(result)
        })

        // payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            console.log(price, "intent price");
            const amount = parseInt(price * 100)

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
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