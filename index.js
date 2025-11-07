import express from "express";
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 2000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("server is getting")
})

app.listen(PORT, () => {
    console.log(`Server is running in the port ${PORT}`)
})