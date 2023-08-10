const express = require("express");
const server = express();
const mongoose = require("mongoose");

const connectToMongodb = require("./Connection");
const { CreateProduct } = require("./controller/Product");
const productsRouter =require("./routes/Products")
const categoriesRouter =require("./routes/Categories")
const brandsRouter =require("./routes/Brands")
const cors=require('cors')
require("dotenv").config();
const PORT = process.env.PORT || 8000;

//connection for mongoDb atlas
const dataBase = "e-commerce";
const collection = "E-data";
const URL = process.env.URL;
connectToMongodb(URL, dataBase, collection);

//MiddleWares
server.use(express.json());
server.use(cors({
  exposedHeaders:['X-Total-Count']
}));
//Routes
server.use('/products',productsRouter.router)
server.use('/categories',categoriesRouter.router)
server.use('/brands',brandsRouter.router)


server.listen(PORT, () => {
  console.log(`server connected at ${PORT}`);
});
