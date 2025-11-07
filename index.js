import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 2000;
const uri = process.env.DB;
let cachedClient = null;

async function connectDB() {
  if (!cachedClient) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    cachedClient = client;
  }
  const db = cachedClient.db("3D-Models");
  return {
    modelCollection: db.collection("models"),
    downloadsCollection: db.collection("users-downloads"),
  };
}

// Routes
app.get("/", (req, res) => {
  res.send("server is getting");
});

app.get("/models", async (req, res) => {
  try {
    const { modelCollection } = await connectDB();
    const result = await modelCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/latest-models", async (req, res) => {
  try {
    const { modelCollection } = await connectDB();
    const result = await modelCollection.find().sort({ created_at: -1 }).limit(6).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/my-models", async (req, res) => {
  try {
    const { modelCollection } = await connectDB();
    const result = await modelCollection.find({ created_by: req.query.email }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/models/:id", async (req, res) => {
  try {
    const { modelCollection } = await connectDB();
    const result = await modelCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/models", async (req, res) => {
  try {
    const { modelCollection } = await connectDB();
    const result = await modelCollection.insertOne(req.body);
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete("/models/:id", async (req, res) => {
  try {
    const { modelCollection } = await connectDB();
    const result = await modelCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.patch("/models/:id", async (req, res) => {
  try {
    const { modelCollection } = await connectDB();
    const result = await modelCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/downloads", async (req, res) => {
  try {
    const { downloadsCollection } = await connectDB();
    const result = await downloadsCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/models/:id", async (req, res) => {
  try {
    const { modelCollection, downloadsCollection } = await connectDB();
    const id = new ObjectId(req.params.id);
    const email = req.Token_email;

    const exist = await downloadsCollection.findOne({ email });
    let result = null;

    const alreadyDownloaded = exist?.downloaded_Models?.some((modelId) => modelId.equals(id));

    if (!alreadyDownloaded) {
      if (!exist) {
        result = await downloadsCollection.insertOne({
          email,
          downloaded_Models: [id],
        });
      } else {
        result = await downloadsCollection.updateOne(
          { email },
          { $addToSet: { downloaded_Models: id } }
        );
      }
      await modelCollection.updateOne({ _id: id }, { $inc: { downloads: 1 } });
    } else {
      result = { message: "Model already downloaded by this user" };
    }

    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(PORT, () => { console.log(`Server is running in the port ${PORT}`) })