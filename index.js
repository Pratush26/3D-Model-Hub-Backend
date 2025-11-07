import express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 2000;
const uri = process.env.DB;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);
async function connectDB() {
    try {
        await client.connect();
        const myDB = client.db("3D-Models");
        app.get('/kk', async (req, res) => {
            const myColl = myDB.collection("pizzaMenu");
            const doc = { name: "Neapolitan pizza", shape: "round" };
            const result = await myColl.insertOne(doc);
            res.send(result)
        })
    } catch (err) {
        console.error("Error From DB : ", err)
    }
}
connectDB()

app.get('/', (req, res) => {
    res.send("server is getting")
})

app.listen(PORT, () => {
    console.log(`Server is running in the port ${PORT}`)
})