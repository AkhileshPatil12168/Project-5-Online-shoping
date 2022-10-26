const productModel = require("../models/productModel")
const { uploadFile } = require("../AWS/aws")
const { emptyBody, isValidString, validTrim, isValidWord, isNotProvided, isValidImage, isValidSize, isValidObjectId, isValidTitle, } = require("../utils/validators");

const createProduct = async function (req, res) {
    try {

        if (emptyBody(req.body)) return res.status(400).send({ status: false, message: "provide some data" })
        data = req.body
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = data

        if (!title) return res.status(400).send({ status: false, message: "title must be present" })
        if (!isValidString(title)) return res.status(400).send({ status: false, message: "title is in incorrect format" })
        data.title = validTrim(title)
        let isUniqueTitle = await productModel.findOne({ title: data.title });
        if (isUniqueTitle) {
            return res.status(400).send({ status: false, message: "This title is being used already" })
        }



        if (!description) return res.status(400).send({ status: false, message: "description must be present" })
        if (!isValidString(description)) return res.status(400).send({ status: false, message: "description is in incorrect format" })
        data.description = validTrim(description)



        if (!price || price == 0) return res.status(400).send({ status: false, message: "price cannot be empty" })

        price = validTrim(price)
        if (!Number(price)) return res.status(400).send({ status: false, message: "price should be in valid number/decimal format" })
        data.price = Number(price).toFixed(2)

        if (!currencyId) return res.status(400).send({ status: false, message: "provide the currencyId" })
        data.currencyId = (currencyId).trim()
        if (!isNotProvided(currencyId)) return res.status(400).send({ status: false, message: "currencyId cannot be empty" })
        if (data.currencyId !== "INR") return res.status(400).send({ status: false, message: "only indian currencyId is allowed and the type should be string" })


        if (!currencyFormat) return res.status(400).send({ status: false, message: "provide the currencyFormat" })
        data.currencyFormat = (currencyFormat).trim()
        if (!isNotProvided(currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat cannot be empty" })
        if (data.currencyFormat !== "₹") return res.status(400).send({ status: false, message: "only indian currencyFormat is allowed and the type should be string" })

        if (isFreeShipping) {
            let a = ["true", "false"]
            isFreeShipping = validTrim(isFreeShipping)
            if (!a.includes(isFreeShipping)) return res.status(400).send({ status: false, message: "type should be Boolean or true/false" })
            data.isFreeShipping = validTrim(isFreeShipping)
        }

        let files = req.files

        if (files.length == 0) return res.status(400).send({ status: false, message: "provide a product image" })
        if (!isValidImage(files[0].originalname)) return res.status(400).send({ status: false, message: "provide a valid image" })
        data.productImage = await uploadFile(files[0])

        if (style) {
            style = validTrim(style)
            if (!isValidString(style))
                return res.status(400).send({ status: false, message: "style is in incorrect format" })
            data.style = validTrim(style)
        }

        if (!availableSizes) return res.status(400).send({ status: false, message: "provide at lest one size" })
        if (!isNotProvided(availableSizes)) return res.status(400).send({ status: false, message: "provide at lest one size" })
        availableSizes = availableSizes.toUpperCase()
        let size = availableSizes.split(",")
        if (!size.every(s => isValidSize(s))) return res.status(400).send({ status: false, message: "this size is not available" })
        data.availableSizes = size

        if (installments) {
            installments = validTrim(installments)
            if (!Number(installments)) return res.status(400).send({ status: false, message: "installments should be in valid number format" })
            data.installments = Number(installments)
        }

        const createdProduct = await productModel.create(data)

        return res.status(201).send({ status: true, message: 'Success', data: createdProduct })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


const getProductByFilter = async function (req, res) {
    try {
        const filters = req.query
        let { title, price, availableSizes, style, priceLessThan, priceGreaterThan } = filters

        if (!emptyBody(filters)) {
            filters["isDeleted"] = false

            //validating title
            if (title || title === "") {
                title = validTrim(title)
                if (!isNotProvided(title)) return res.status(400).send({ status: false, message: "provide the title" })
                if (!isValidString(title)) return res.status(400).send({ status: false, message: "provide valid title" })
                filters["title"] = title
            }

            //validating price
            if (price || price === "") {
                price = validTrim(price)
                if (!isNotProvided(price)) return res.status(400).send({ status: false, message: "provide the price" })
                if (!Number(price)) return res.status(400).send({ status: false, message: "price must be in number" })
                if (price <= 0) return res.status(400).send({ status: false, message: "there are no free products" })
                filters["price"] = price
            }

            //validating availableSizes
            if (availableSizes || availableSizes === "") {
                availableSizes = validTrim(availableSizes)
                if (!isNotProvided(availableSizes)) return res.status(400).send({ status: false, message: "provide the size" })
                availableSizes = availableSizes.toUpperCase()
                let size = availableSizes.split(",")
                if (!size.every(s => isValidSize(s))) return res.status(400).send({ status: false, message: "this size is not available" })

                filters["availableSizes"] = { $in: size }
            }

            //validating style
            if (style || style === "") {
                style = validTrim(style)
                if (!isNotProvided(style)) return res.status(400).send({ status: false, message: "provide the style" })
                if (!isValidString(style)) return res.status(400).send({ status: false, message: "provide valid style" })
                filters["style"] = style
            }


            //validating priceGreaterThan
            if (priceGreaterThan || priceGreaterThan === "") {
                priceGreaterThan = validTrim(priceGreaterThan)
                if (!isNotProvided(priceGreaterThan)) return res.status(400).send({ status: false, message: "provide the price" })

                if (!Number(priceGreaterThan)) return res.status(400).send({ status: false, message: "price must be in number" })
                filters["price"] = { $gte: priceGreaterThan }
            }

            //validating availableSizes
            if (priceLessThan || priceLessThan === "") {
                priceLessThan = validTrim(priceLessThan)
                if (!isNotProvided(priceLessThan)) return res.status(400).send({ status: false, message: "provide the price" })

                if (!Number(priceLessThan)) return res.status(400).send({ status: false, message: "price must be in number" })
                filters["price"] = { $lte: priceLessThan }
            }

            if (priceGreaterThan && priceLessThan) {
                filters["price"] = { $gte: priceGreaterThan, $lte: priceLessThan }
            }

            const productData = await productModel.find(filters).lean()
            if (productData.length == 0) return res.status(404).send({ status: false, msg: "no product found" })
            if (priceLessThan) {
                const sortedData = productData.sort((a, b) => b.price - a.price)
                return res.status(200).send({ status: true, data: sortedData })
            } else {
                const sortedData = productData.sort((a, b) => a.price - b.price)
                return res.status(200).send({ status: true, data: sortedData })
            }

        } else {
            const productData = await productModel.find({ isDeleted: false })
            return res.status(200).send({ status: true, data: productData })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const getProductsById = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!productId) return res.status(400).send({ status: false, message: "provide Product Id" })

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "provide a valid Product Id" })


        let productsDetails = await productModel.findOne({_id :productId, isDeleted : false})
        if (!productsDetails) return res.status(404).send({ status: false, message: "Product Not Found" })

        return res.status(200).send({ status: true, message: "Success", data: productsDetails })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}


const updateProduct = async (req, res) => {
    try {

        let productId = req.params.productId
        let data = req.body

        if (!productId) return res.status(400).send({ status: false, message: "provide Product Id" })

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "provide a valid Product Id" })


        let productsDetails = await productModel.findOne({_id :productId, isDeleted : false})
        if (!productsDetails) return res.status(404).send({ status: false, message: "Product Not Found" })
        if (emptyBody(data)) return res.status(400).send({ status: false, message: "provide some data" })

        let { title, description, price, isFreeShipping, style, size, installments, productImage } = data
        data.isDeleted = false
        if (title || title === "") { 
            title = validTrim(title)
            if (!isNotProvided(title)) return res.status(400).send({ status: false, message: "provide the title" })
            if (!isValidTitle(title)) return res.status(400).send({ status: false, message: "provide valid title" })
            data.title = title
            let isUniqueTitle = await productModel.findOne({ title: data.title });
            if (isUniqueTitle) {
                return res.status(400).send({ status: false, message: "This title is being used already" })
            } 
        }

        if (description || description === "") {
            description = validTrim(description)
            if (!isNotProvided(description)) return res.status(400).send({ status: false, message: "provide the description" })
            if (!isValidString(description)) return res.status(400).send({ status: false, message: "provide valid description" })
            data.description = description

        }

        if (price || price === "") {
            price = validTrim(price)
            if (!isNotProvided(price)) return res.status(400).send({ status: false, message: "price cannot be empty" })

            if (!Number(price)) return res.status(400).send({ status: false, message: "price should be in valid number format" })
            if (price <= 0) return res.status(400).send({ status: false, message: "product can not be free" })
            data.price = Number(price).toFixed(2)


        }

        if (isFreeShipping) {
            let a = ["true", "false"]
            isFreeShipping = validTrim(isFreeShipping)
            if (!a.includes(isFreeShipping)) return res.status(400).send({ status: false, message: "type should be in true or false" })
            data.isFreeShipping = validTrim(isFreeShipping)
        }

        if (style) {
            style = validTrim(style)
            if (!isValidString(style))
                return res.status(400).send({ status: false, message: "style is in incorrect format" })
            data.style = validTrim(style)
        }

        if (installments) {
            installments = validTrim(installments)
            if (!Number(installments)) return res.status(400).send({ status: false, message: "installments should be in valid number/decimal format" })
            data.installments = Number(installments)
        }

        if (size) {
            availableSizes = validTrim(size)
            if (!isNotProvided(size)) return res.status(400).send({ status: false, message: "provide the size" })
            size = size.toUpperCase()
            size = size.split(",")
            if (!size.every(s => isValidSize(s))) return res.status(400).send({ status: false, message: "this size is not available" })
            data.availableSizes = size
        }

        let files = req.files
        if (files.length > 0) {

            if (!isValidImage(files[0].originalname)) return res.status(400).send({ status: false, message: "provide a valid image" })
            data.productImage = await uploadFile(files[0])

        }

        let updateData = await productModel.findByIdAndUpdate(productId, data, { new: true })
        if (!updateData) return res.status(404).send({ status: true, message: "Product Not Found" })
        return res.status(200).send({ status: true, message: "Updated  Successfully", data: updateData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const delProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!productId) return res.status(400).send({ status: false, message: "provide Product Id" })

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "provide a valid Product Id" })

        let productDelete = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true })

        if (!productDelete)
            return res.status(404).send({ status: false, message: "Product Not Found" })

        return res.status(200).send({ status: true, message: "Successfully Deleted" })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}
module.exports = { createProduct, getProductByFilter, getProductsById, updateProduct, delProduct }