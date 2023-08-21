const express=require("express");
const router=express.Router();
const {fetchBrands, createBrand} =require("../controller/Brand")

router.get('/',fetchBrands).post('/',createBrand);

exports.router=router;