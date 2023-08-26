const { Product } = require("../model/Product");

exports.createProduct = async (req, res) => {
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
    const searchQuery = req.query.product.trim(); // Remove any leading/trailing spaces
  
    query = query.find({ title: { $regex: searchQuery, $options: 'i' } });
    totalProductsQuery = totalProductsQuery.find({
      title: { $regex: searchQuery, $options: 'i' },
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
  try {
    const docs = await query.exec();
    res.set("X-Total-Count", totalDocs);
    res.status(200).json(docs);
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
  console.log('Received search query:', searchQuery); // Log the received search query

  try {
    console.log('Trying to search for products...'); // Log before performing the search
    const products = await Product.find({ title: { $regex: searchQuery, $options: 'i' } });
    console.log('Search successful. Products found:', products); // Log after performing the search
    res.status(200).json(products);
  } catch (error) {
    console.error('Error:', error); // Log any errors that occur
    res.status(400).json(error);
  }
};


exports.updateProduct = async (req, res) => {
  const { id } = req.params;

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
