const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId


let cartSchema = new mongoose.Schema({

    userId: { type: objectId, ref: "user", required: true, unique: true },
    items: [{
        productId: { type: objectId, ref: "products", required: true },
        quantity: { type: Number, required: true, minlen: 1 }
    }],
    totalPrice: { type: Number, required: true },
    totalItems: { type: Number, required: true },
},
    { timestamps: true })

module.exports = mongoose.model("cart", cartSchema)