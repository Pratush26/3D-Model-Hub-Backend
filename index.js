import express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

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
        const db = client.db("3D-Models");
        const modelCollection = db.collection("models");
        const downloadsCollection = db.collection("users-downloads");

        //  Models get request
        //  Public API
        app.get("/models", async (req, res) => {
            try {
                const result = await modelCollection.find().toArray();
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });
        app.get("/latest-models", async (req, res) => {
            try {
                const result = await modelCollection.find({ created_at: "desc" }).limit(6).toArray();
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });

        //  Private APIs
        app.get("/my-models", async (req, res) => {
            try {
                const result = await modelCollection.find({ created_by: req.query.email }).toArray();
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });
        app.get("/models/:id", async (req, res) => {
            try {
                const result = await modelCollection.findOne({ _id: new ObjectId(req.params.id) });
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });

        // Models post/put/delete request
        app.post("/models", async (req, res) => {
            try {
                const result = await modelCollection.insertOne(req.body);
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });
        app.delete("/models/:id", async (req, res) => {
            try {
                const result = await modelCollection.deleteOne({ _id: new ObjectId(req.params.id) });
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });
        app.patch("/models/:id", async (req, res) => {
            try {
                const result = await modelCollection.updateOne({ _id: new ObjectId(req.params.id)}, { $set: req.body });
                res.send(result);
            } catch (err) {
                res.status(500).send(err);
            }
        });

        //  Users Downloaded models request
        app.get("/downloads", async (req, res) => {
            try {
                const result = await downloadsCollection.find().toArray();
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });
        app.post("/models/:id", async (req, res) => {
            try {
                const id = new ObjectId(req.params.id)
                const exist = await downloadsCollection.findOne({ email: req.Token_email });
                let result = null;
                if (!exist) {
                    result = await downloadsCollection.insertOne({ email: req.Token_email, downloaded_Models: [id] });
                } else {
                    result = await downloadsCollection.updateOne(
                        { email: req.Token_email },
                        { $addToSet: { downloaded_Models: id } }
                    );
                }
                await modelCollection.updateOne({ _id: id }, { $inc: { downloads: 1 } });
                res.send(result);
            } catch (err) {
                res.send(err)
            }
        });
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