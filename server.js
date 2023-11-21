const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();

const port = 5000 || process.env.PORT;

const uri = "mongodb://0.0.0.0:27017";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const db = client.db("mission-two");
    const userCollection = db.collection("users");

    // get all
    app.get("/", async (req, res) => {
      const users = await userCollection.aggregate([]).toArray();
      console.log(users);
      res.send({ users, count: users.length });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
};
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening on port " + port);
});
