const mongoose = require("mongoose");
// const UserModel = require("./model/user"); // Assuming UserModel is the model you want to use

function connectToMongodb(url, database, collectionName) {
   mongoose
    .connect(`${url}${database}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      const collection = mongoose.connection.collection(collectionName);
      console.log(
        "Connected to MongoDB Atlas and specific database and collection!"
      );
      return collection; // You can return the collection if needed
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB Atlas:", error);
    });
}

module.exports = connectToMongodb;
