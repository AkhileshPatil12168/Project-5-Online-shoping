

const cartModel = require("../models/cartModel")
const orderModel = require('../models/orderModel');
const { isValidObjectId, isValidStatus, validTrim } = require("../utils/validators")

const orderCreation = async function (req, res) {
    try {
        const userId = req.params.userId
        const decodedToken = req.verifyed
        let { cancellable } = req.body

        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "please login again" })


        const cart = await cartModel.findOne({ userId: userId }).lean().select({ updatedAt: 0, createdAt: 0, __v: 0, _id: 0 })
        if (!cart) return res.status(404).send({ status: false, message: "cart not found to place an order.." })
        if (cart.items.length == 0) return res.status(404).send({ status: false, message: "Cart is empty... First add Product to Cart." })

        if (cancellable) {
            let a = ["true", "false"]
            cancellable = validTrim(cancellable)
            if (!a.includes(cancellable)) return res.status(400).send({ status: false, message: "cancellable should be in true or false" })
            cart.cancellable = cancellable
        }
        cart.totalQuantity = cart.items.map(x => x.quantity).reduce((x, y) => x + y)

        const orderCreated = await orderModel.create(cart)

        await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })

        return res.status(201).send({ status: true, message: "Success", data: orderCreated })


    }

    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


const getOrder = async (req, res) => {
    try {
        const userId = req.params.userId
        const decodedToken = req.verifyed

        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "please login again" })

        const orders = await orderModel.find({ userId: userId, isDeleted: false }).select({ isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean()
        if (!orders) return res.status(400).send({ status: false, message: "you don't have any order" })
        return res.status(200).send({ status: true, message: 'Success', data: orders })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}





const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const decodedToken = req.verifyed
        const status = req.body.status
        const orderId = req.body.orderId

        if (!userId) return res.status(400).send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId) return res.status(403).send({ status: false, message: "please login again" })

        if (!orderId) return res.status(400).send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "Please provide a valid userId." })

        const newOrder = await orderModel.findById(orderId)
        if (!newOrder) return res.status(404).send({ status: false, message: "order not found" })
        if (newOrder.status == "completed") return res.status(400).send({ status: false, message: "order is alredy completed" })
        if (newOrder.status == "cancelled") return res.status(400).send({ status: false, message: "your order is cancelled" })


        if (!status) return res.status(400).send({ status: false, message: "status is mandatory" })
        if (!isValidStatus(status)) return res.status(400).send({ status: false, message: "status should be pending, completed,cancelled" })
        if (newOrder.cancellable == false && status == "cancelled") return res.status(400).send({ status: false, message: "you cannot cancel this order" })
        const orderUpdate = await orderModel.findOneAndUpdate({ _id: newOrder._id }, { status: status }, { new: true })

        return res.status(200).send({ status: true, message: 'Success', data: orderUpdate })
    }

    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = { orderCreation,getOrder, updateOrder }