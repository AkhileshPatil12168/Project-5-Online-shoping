const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const { isNotProvided, isValidObjectId } = require("../utils/validators")


const creatCart = async (req, res) => {
    try {
        const userId = req.params.userId
        const decodedToken = req.verifyed
        let productId = req.body.productId

        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "please login again" })

        productId = productId.trim()

        if (!isNotProvided(productId)) return res.status(400).send({ status: false, message: "Please provide productId." })

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please provide a valid productId." })

        const productData = await productModel.findOne({ _id: productId, isDeleted: false }).lean()

        if (!productData) return res.status(400).send({ status: false, message: "product not found" })

        let userCart = await cartModel.findOne({ userId: userId }).lean()

        if (userCart) {
            if (userCart.items.length == 0) {
                userCart.items.push({
                    productId: productId,
                    quantity: 1
                })
                userCart.totalPrice += productData.price
                userCart.totalItems += 1

            } else {

                for (let i = 0; i < userCart.items.length; i++) {
                    let cartProdId = userCart.items[i].productId.toString()
                    let productId = productData._id.toString()
                    if (cartProdId === productId) {
                        userCart.items[i].quantity = userCart.items[i].quantity + 1
                        userCart.totalPrice += productData.price
                        break
                    }
                    if (i + 1 === userCart.items.length) {
                        userCart.items.push({
                            productId: productId,
                            quantity: 1
                        })
                        userCart.totalPrice += productData.price
                        userCart.totalItems += 1
                        break
                    }
                }
            }
            let cartCreated = await cartModel.findByIdAndUpdate(userCart._id, userCart, { new: true })
            return res.status(201).send({ status: true, message: "Product has been added to the Cart", data: cartCreated })


        } else {
            let cart = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: 1
                }],
                totalPrice: productData.price,
                totalItems: 1
            }

            let cartCreated = await cartModel.create(cart)

            return res.status(201).send({ status: true, message: "Product has been added to the Cart", data: cartCreated })

        }
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId
        const decodedToken = req.verifyed
        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "please login again" })

        let cartData = await cartModel.findOne({ userId: userId })
        if (!cartData) return res.status(404).send({ status: false, message: "Cart Not Found" })
        if (cartData.totalItems == 0) return res.status(404).send({ status: false, message: "cart is empty" })
        return res.status(200).send({ status: true, message: 'success', data: cartData })
    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}

const updatecart = async (req, res) => {
    try {
        let userId = req.params.userId
        const decodedToken = req.verifyed
        let { productId, removeProduct, addProduct } = req.body
        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "please login again" })
        if (removeProduct || addProduct) {
            if (removeProduct && addProduct) return res.status(400).send({ status: false, message: "removing and adding product cannot be done at same time." })
            if (removeProduct < 0 || addProduct <= 0) return res.status(400).send({ status: false, message: "you cannot add 0 products and negetive numbers are not valid " })
        } else {
            return res.status(400).send({ status: false, message: "please provid valid addProduct or removeProduct quantity." })
        }
        productId = productId.trim()

        const productData = await productModel.findOne({ _id: productId, isDeleted: false }).lean()

        if (!productData) return res.status(400).send({ status: false, message: "product not found" })

        let cartData = await cartModel.findOne({ userId: userId })
        if (!cartData) return res.status(400).send({ status: false, message: "no items in cart." })
        if (cartData.totalItems == 0) return res.status(404).send({ status: false, message: "cart is empty" })

        for (let i = 0; i < cartData.items.length; i++) {
            let cartProdId = cartData.items[i].productId.toString()
            if (cartProdId === productId) {
                if (addProduct) {
                    cartData.items[i].quantity = cartData.items[i].quantity + addProduct
                    cartData.totalPrice += productData.price * addProduct
                    break

                }
                if (removeProduct > 0) {
                    if (cartData.items[i].quantity >= removeProduct) {
                        cartData.items[i].quantity = cartData.items[i].quantity - removeProduct
                        cartData.totalPrice -= productData.price * removeProduct

                        if (cartData.items[i].quantity == 0) {
                            cartData.totalItems -= 1
                            cartData.items.splice(i, 1)
                            break
                        }
                        break
                    } else {
                        return res.status(400).send({ status: false, message: "the total items counts is less" })
                    }

                }
                if (removeProduct == 0) {
                    //cartData.items[i].quantity = cartData.items[i].quantity - removeProduct
                    cartData.totalPrice -= productData.price * cartData.items[i].quantity
                    cartData.totalItems -= 1
                    cartData.items.splice(i, 1)
                    break

                }


            }
            if (i + 1 == cartData.items.length) {
                return res.status(400).send({ status: false, message: "this item is not in your cart" })
            }
        }

        let cartCreated = await cartModel.findByIdAndUpdate(cartData._id, cartData, { new: true })
        return res.status(201).send({ status: true, message: "cart has been updated sucessfully", data: cartCreated })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const deletecart = async function (req, res) {
    try {
        let userId = req.params.userId
        const decodedToken = req.verifyed
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "please login again" })

        let cartExist = await cartModel.findOne({ userId: userId }).lean()
        if (!cartExist) return res.status(404).send({ status: false, msg: "cart not found" })
        if (cartExist.totalItems == 0) return res.status(404).send({ status: false, msg: "cart is empty" })

        const cartDeleted = await cartModel.findByIdAndUpdate(cartExist._id, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })
        return res.status(204).send({ status: true, msg: "No Item in cart", data: cartDeleted })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { creatCart, getCart, updatecart, deletecart }

