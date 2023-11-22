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
    const dataCollection = db.collection("massive-data");

    // get all
    app.get("/", async (req, res) => {
      const data = await dataCollection.aggregate([]).toArray();
      console.log(data);
      res.send({ data, count: data.length });
    });

    // question 1
    app.get("/active-by-gender", async (req, res) => {
      const data = await dataCollection
        .aggregate([
          {
            $match: { isActive: true },
          },
          {
            $group: {
              _id: "$gender",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              gender: "$_id",
              count: "$count",
            },
          },
          {
            $sort: { gender: -1 },
          },
        ])
        .toArray();
      console.log(data);
      res.send({ data, count: data.length });
    });

    // question 2
    app.get("/active-favorite", async (req, res) => {
      const data = await dataCollection
        .aggregate([
          {
            $match: { isActive: true, favoriteFruit: "banana" },
          },
          {
            $project: {
              _id: 0,
              name: 1,
              email: 1,
            },
          },
        ])
        .toArray();
      console.log(data);
      res.send({ data, count: data.length });
    });

    // question 3
    app.get("/favorite-average-age", async (req, res) => {
      const data = await dataCollection
        .aggregate([
          {
            $group: {
              _id: "$favoriteFruit",
              averageAge: { $avg: "$age" },
            },
          },
          {
            $project: {
              _id: 0,
              favoriteFruit: "$_id",
              averageAge: { $round: ["$averageAge", 2] },
            },
          },
          {
            $sort: { averageAge: -1 },
          },
        ])
        .toArray();
      console.log(data);
      res.send({ data, count: data.length });
    });

    // question 4
    app.get("/unique-friend-names", async (req, res) => {
      const data = await dataCollection
        .aggregate([
          {
            $unwind: "$friends",
          },
          {
            $match: { "friends.name": /^W/i },
          },
          {
            $group: {
              _id: "$friends.name",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              name: "$_id",
              count: 1,
            },
          },
          {
            $sort: { count: -1 },
          },
        ])
        .toArray();
      console.log(data);
      res.send({ data, count: data.length });
    });

    // question 5
    app.get("/age-range-group", async (req, res) => {
      const data = await dataCollection
        .aggregate([
          {
            $facet: {
              smaller: [
                {
                  $match: { age: { $lte: 30 } },
                },
                {
                  $bucket: {
                    groupBy: "$age",
                    boundaries: [0, 5, 10, 15, 20, 25, 30],
                    default: 30,
                    output: {
                      count: { $sum: 1 },
                      // ages: { $push: "$age" },
                    },
                  },
                },
              ],
              elder: [
                {
                  $match: { age: { $gt: 30 } },
                },
                {
                  $bucket: {
                    groupBy: "$age",
                    boundaries: [31, 35, 40, 45, 50, 55, 60],
                    default: 60,
                    output: {
                      count: { $sum: 1 },
                      // ages: { $push: "$age" },
                    },
                  },
                },
              ],
            },
          },
        ])
        .toArray();
      console.log(data);
      res.send({ data: data?.[0] });
    });

    // question 6
    app.get("/total-company-balance", async (req, res) => {
      const limit = +req.query.limit || 2;
      const page = +req.query.page || 1;
      const skip = limit * page - limit;
      const data = await dataCollection
        .aggregate([
          {
            $project: {
              company: 1,
              balance: {
                $toDouble: {
                  $trim: {
                    input: {
                      $replaceAll: {
                        input: "$balance",
                        find: ",",
                        replacement: "",
                      },
                    },
                    chars: {
                      $literal: "$",
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: "$company",
              totalBalance: { $sum: "$balance" },
            },
          },
          {
            $facet: {
              data: [
                {
                  $project: {
                    _id: 0,
                    company: "$_id",
                    totalBalance: 1,
                  },
                },
                {
                  $sort: { totalBalance: -1 },
                },
                {
                  $skip: skip,
                },
                {
                  $limit: limit,
                },
              ],
              total: [
                {
                  $count: "count",
                },
              ],
            },
          },
        ])
        .toArray();
      console.log(data);
      const total = data[0]?.total?.[0]?.count || 0;
      res.send({
        data: data[0]?.data,
        total,
        currentPage: page,
        totalPage: Math.ceil(total / limit),
      });
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
