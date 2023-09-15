const { Product } = require("../model/Product");
// const client=require('../Redis')
const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});
// Handle Redis client errors
client.on('error', (err) => {
  console.error('Redis client error:', err);
});

// Connect to Redis
client.connect();

exports.createProduct = async (req, res) => {
  if(client.get("products")){
    await client.del("products")
  }
  const product = new Product(req.body);
  product.discountPrice = Math.round(
    product.price * (1 - product.discountPercentage / 100)
  );
  try {
    const doc = await product.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};
exports.fetchAllProducts = async (req, res) => {
  try {
    const cachedData = await client.get('products');
    if (cachedData && !(req.query.category) && (req.query._page==1) && !(req.query.product) && !(req.query.brand) && !(req.query._sort) && !(req.query._order)) {
      console.log('cached data is here')
      const parsedData = JSON.parse(cachedData);
      res.status(200).json(parsedData);
    } else {
      let condition = {};
      if (!req.query.admin) {
        condition.deleted = { $ne: true };
      }
      let query = Product.find(condition);
      let totalProductsQuery = Product.find(condition);
      if (req.query.category) {
        query = query.find({ category: { $in: req.query.category.split(",") } });
        totalProductsQuery = totalProductsQuery.find({
          category: req.query.category,
        });
      }
      if (req.query.product) {
        const searchQuery = req.query.product.trim();
        query = query.find({ title: { $regex: searchQuery, $options: "i" } });
        totalProductsQuery = totalProductsQuery.find({
          title: { $regex: searchQuery, $options: "i" },
        });
      }

      if (req.query.brand) {
        query = query.find({ brand: { $in: req.query.brand.split(",") } });
        totalProductsQuery = totalProductsQuery.find({
          brand: { $in: req.query.brand.split(",") },
        });
      }
      if (req.query._sort && req.query._order) {
        query = query.sort({ [req.query._sort]: req.query._order });
      }
      const totalDocs = await totalProductsQuery.count().exec();
      if (req.query._page && req.query._limit) {
        const pageSize = req.query._limit;
        const page = req.query._page;
        query = query.skip(pageSize * (page - 1)).limit(pageSize);
      }
      const docs = await query.exec();

      // Cache the data in Redis
      // await client.connect()
      // await client.quit()
      res.set("X-Total-Count", totalDocs);
      await client.set('products', JSON.stringify(docs), 'EX', 86400); // Cache for 24 hours

      res.status(200).json(docs);
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json(error);
  }
};
exports.fetchProductBySearch = async (req, res) => {
  const searchQuery = req.query.product;
  console.log("Received search query:", searchQuery); // Log the received search query

  try {
    console.log("Trying to search for products..."); // Log before performing the search
    const products = await Product.find({
      title: { $regex: searchQuery, $options: "i" },
    });
    console.log("Search successful. Products found:", products); // Log after performing the search
    res.status(200).json(products);
  } catch (error) {
    console.error("Error:", error); // Log any errors that occur
    res.status(400).json(error);
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  if(client.get("products")){
    await client.del("products")
  }
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    product.discountPrice = Math.round(
      product.price * (1 - product.discountPercentage / 100)
    );
    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json(error);
  }
};
