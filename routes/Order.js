const express=require("express");
const router=express.Router();
const {createOrder,fetchOrdersByUser,deleteOrder,updateOrder, fetchAllOrders}=require("../controller/Order")

router.post("/",createOrder)
       .get('/own',fetchOrdersByUser)
       .delete('/:id',deleteOrder)
       .patch('/:id',updateOrder)
       .get('/',fetchAllOrders)
       
exports.router=router;