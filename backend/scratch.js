import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const complaints = await db.collection("complaints").find({}).sort({createdAt: -1}).limit(5).toArray();
    console.log(JSON.stringify(complaints, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
