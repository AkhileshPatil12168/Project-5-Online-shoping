const express = require("express");
const router = express.Router()
const {createUser, loginUser, getUserDetails,updateUser}= require("../controllers/userController")
const {createProduct,getProductByFilter, getProductsById,updateProduct,delProduct}= require("../controllers/productCotroller")
const {creatCart,getCart,updatecart,deletecart}= require("../controllers/cartController")
const {orderCreation,getOrder, updateOrder}= require("../controllers/orderController")
const {authentication}= require("../middleware/auth")

router.get("/test", (req, res)=>{ 
    res.send("hello")
})


//---------------------------------PHASE 1----------------------//
router.post("/register",createUser)
router.post("/login", loginUser)
 router.get("/user/:userId/profile",authentication,getUserDetails);
 router.put("/user/:userId/profile",authentication,updateUser)
//---------------------------------PHASE 2----------------------//
 router.post("/products",createProduct)
 router.get('/products',getProductByFilter)
 router.get('/products/:productId',getProductsById)
 router.put("/products/:productId",updateProduct)
router.delete('/products/:productId',delProduct)
//---------------------------------PHASE 3----------------------//
 router.post('/users/:userId/cart',authentication,creatCart)
 router.put('/users/:userId/cart',authentication,updatecart)
router.get('/users/:userId/cart',authentication,getCart)
 router.delete('/users/:userId/cart',authentication,deletecart)
//---------------------------------------------------------------------------------------------------------------------------------------------
router.post('/users/:userId/orders',authentication,orderCreation)
router.get('/users/:userId/orders', authentication,getOrder )
router.put('/users/:userId/orders',authentication,updateOrder)

router.all("/*", function (req, res) {
    res.status(404).send({ status: false, message: "invalid request!!" });
  });

module.exports = router