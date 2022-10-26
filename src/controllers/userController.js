const userModel = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { emptyBody, isNotProvided, validTrim, isValidWord, isValidEmail, isValidPhone, isValidPwd, isValidPincode, isValidImage, isValidObjectId } = require("../utils/validators")
const { uploadFile } = require('../aws/aws')

const createUser = async (req, res) => {
    try {
        let files = req.files

        let { fname, lname, email, phone, password, address } = req.body

        if (emptyBody(req.body)) return res.status(400).send({ status: false, message: "provide some data" })

        if (!fname) return res.status(400).send({ status: false, message: "First name is required" })
        fname = validTrim(fname)
        if (!isValidWord(fname)) return res.status(400).send({ status: false, message: "enter a valid fname" })


        if (!lname) return res.status(400).send({ status: false, message: "last name is required" })
        lname = validTrim(lname)
        if (!isValidWord(lname)) return res.status(400).send({ status: false, message: "enter a valid lname" })

        if (!email) return res.status(400).send({ status: false, message: "email is required" })
        email = validTrim(email)
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "enter a valid email" })


        let checkEmail = await userModel.findOne({ email: email })
        if (checkEmail)
            return res
                .status(400)
                .send({ status: false, message: "Email already exist" })



        if (!phone) return res.status(400).send({ status: false, message: "phone is required" })
        phone = validTrim(phone)
        if (!isValidPhone(phone)) return res.status(400).send({ status: false, message: "enter a valid phone" })

        let checkPhone = await userModel.findOne({ phone: phone })
        if (checkPhone)
            return res
                .status(400)
                .send({ status: false, message: "Phone number already exist" })

        if (!password) return res.status(400).send({ status: false, message: "password is required" })
        password = password.trim()
        if (!isValidPwd(password)) return res.status(400).send({ status: false, message: "enter a valid password" })
        password = await bcrypt.hash(password, 10)



        if (!address) return res.status(400).send({ status: false, message: "address is required" })
        if (!isNotProvided(address)) return res.status(400).send({ status: false, message: "provide the address" })

        let { shipping, billing } = JSON.parse(address)

        if (!shipping) return res.status(400).send({ status: false, message: "shipping address is required" })


        if (!isNotProvided(shipping.street)) return res.status(400).send({ status: false, message: "shipping street address is required" })
        let streetS = validTrim(shipping.street)
        if (!streetS) return res.status(400).send({ status: false, message: "shipping street address is required" })

        if (!isNotProvided(shipping.city)) return res.status(400).send({ status: false, message: "shipping city address is required" })
        let cityS = validTrim(shipping.city)
        if (!cityS) return res.status(400).send({ status: false, message: "shipping city address is required" })

        if (!isNotProvided(shipping.pincode)) return res.status(400).send({ status: false, message: "shipping pincode is required" })
        let pincodeS = shipping.pincode.trim()
        if (!pincodeS) return res.status(400).send({ status: false, message: "shipping pincode is required" })
        if (!isValidPincode(pincodeS)) return res.status(400).send({ status: false, message: "shipping pincode is not valid" })

        //_____________________________________

        if (!billing) return res.status(400).send({ status: false, message: "billing address is required" })

        if (!isNotProvided(billing.street)) return res.status(400).send({ status: false, message: "billing street address is required" })
        let streetB = validTrim(billing.street)
        if (!streetB) return res.status(400).send({ status: false, message: "billing street address is required" })
        //_________________________
        if (!isNotProvided(billing.city)) return res.status(400).send({ status: false, message: "billing city address is required" })
        let cityB = validTrim(billing.city)
        if (!cityB) return res.status(400).send({ status: false, message: "billing city address is required" })
        //___________________________
        if (!isNotProvided(billing.pincode)) return res.status(400).send({ status: false, message: "billing pincode is required" })
        let pincodeB = validTrim(billing.pincode)
        if (!pincodeB) return res.status(400).send({ status: false, message: "billing pincode is required" })
        if (!isValidPincode(pincodeB)) return res.status(400).send({ status: false, message: "billing pincode is not valid" })

        if (files.length == 0) return res.status(400).send({ status: false, message: "provide a profile image" })
        if (!isValidImage(files[0].originalname)) return res.status(400).send({ status: false, message: "provide a valid image" })
        let profileImage = await uploadFile(files[0])


        let user = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: profileImage,
            phone: phone,
            password: password,
            address: {
                shipping: {
                    street: streetS,
                    city: cityS,
                    pincode: pincodeS,
                },
                billing: {
                    street: streetB,
                    city: cityB,
                    pincode: pincodeB,
                }
            }
        }
        const createUser = await userModel.create(user)

        res.status(201).send({ status: true, message: "User created successfully", data: createUser })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

const loginUser = async function (req, res) {
    try {

        if (emptyBody(req.body))
            return res
                .status(400)
                .send({ status: false, msg: "Email and Password is Requierd" })

        const { email, password } = req.body

        if (!email) return res.status(400).send({ status: false, msg: "User Email is Requierd" })

        if (!password) return res.status(400).send({ status: false, msg: "User Password is Requierd" })

        if (!isValidEmail(email)) return res.status(400).send({ status: false, msg: "Enter Valid Email Id" })

        let user = await userModel.findOne({ email })
        if (!user) return res.status(400).send({ status: false, msg: "User not Exist" })

        let actualPassword = await bcrypt.compare(password, user.password)

        if (!actualPassword) return res.status(400).send({ status: false, msg: "Incorrect email or password" })


        let token = jwt.sign({ userId: user._id },process.env.TOKEN_KEY , {
            expiresIn: "2d",
        })
        res.setHeader('Authorization', `Bearer ${token}`)
        return res.status(200).send({
            status: true, message: "User login successfully",
            data: { userId: user._id, token: token },
        })
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const getUserDetails = async function (req, res) {
    try {
        const userId = req.params.userId
        const decodedToken = req.verifyed

        if (!userId)
            return res
                .status(400)
                .send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId))
            return res
                .status(400)
                .send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId)
            return res
                .status(403)
                .send({ status: false, message: "please login again" })

        const userData = await userModel.findById(userId)
        if (!userData)
            return res
                .status(404)
                .send({ status: false, message: "user not found." })

        return res
            .status(200)
            .send({ status: true, message: "User profile details", data: userData })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}


const updateUser = async (req, res) => {
    try {
        const userId = req.params.userId
        const decodedToken = req.verifyed

        if (!userId)
            return res
                .status(400)
                .send({ status: false, message: "Please provide userId." })

        if (!isValidObjectId(userId))
            return res
                .status(400)
                .send({ status: false, message: "Please provide a valid userId." })

        if (userId !== decodedToken.userId)
            return res
                .status(403)
                .send({ status: false, message: "please login again" })

        const userData = await userModel.findById(userId)
        if (!userData)
            return res
                .status(404)
                .send({ status: false, message: "user not found." })

        if (emptyBody(req.body)) return res.status(400).send({ status: false, message: "provide some data" })
        let files = req.files
        let data = req.body

        let { fname, lname, email, phone, password, address, profileImgUrl } = data

        if (fname) {
            if (!isNotProvided(fname)) return res.status(400).send({ status: false, message: "provide the fname" })

            data.fname = validTrim(fname)
            if (!isValidWord(data.fname)) return res.status(400).send({ status: false, message: "enter a valid fname" })
        }

        if (lname) {
            if (!isNotProvided(lname)) return res.status(400).send({ status: false, message: "provide the lname" })

            data.lname = validTrim(lname)
            if (!isValidWord(data.lname)) return res.status(400).send({ status: false, message: "enter a valid lname" })
        }

        if (email) {
            if (!isNotProvided(email)) return res.status(400).send({ status: false, message: "provide the email" })

            data.email = validTrim(email)
            if (!isValidEmail(data.email)) return res.status(400).send({ status: false, message: "enter a valid email" })
        }

        let checkEmail = await userModel.findOne({ email: data.email })
        if (checkEmail)
            return res
                .status(400)
                .send({ status: false, message: "Email already exist" })


        if (phone) {
            if (!isNotProvided(phone)) return res.status(400).send({ status: false, message: "provide the phone" })

            data.phone = validTrim(phone)
            if (!isValidPhone(data.phone)) return res.status(400).send({ status: false, message: "enter a valid phone" })
        }

        let checkPhone = await userModel.findOne({ phone: data.phone })
        if (checkPhone)
            return res
                .status(400)
                .send({ status: false, message: "Phone number already exist" })

        if (password) {
            if (!isNotProvided([password])) return res.status(400).send({ status: false, message: "provide the password" })

            password = password.trim()
            if (!isValidPwd(password)) return res.status(400).send({ status: false, message: "enter a valid password" })
            data.password = await bcrypt.hash(password, 10)
        }

        if (address) {
            data.address = JSON.parse(address)
            if (!isNotProvided(address)) return res.status(400).send({ status: false, message: "provide the address" })


            let { shipping, billing } = data.address


            if (shipping) {
                let { street, city, pincode } = shipping
                if (!isNotProvided(shipping)) return res.status(400).send({ status: false, message: "provide the address" })

                if (street || street == "") {
                    if (!isNotProvided(street)) return res.status(400).send({ status: false, message: "shipping street address is required" })
                    data.address.shipping["street"] = validTrim(street)
                    if (!data.address.shipping.street) return res.status(400).send({ status: false, message: "shipping street address is required" })
                }

                if (city || city == "") {
                    if (!isNotProvided(city)) return res.status(400).send({ status: false, message: "shipping city address is required" })
                    data.address.shipping.city = validTrim(city)
                    if (!data.address.shipping.city) return res.status(400).send({ status: false, message: "shipping city address is required" })
                }

                if (pincode || pincode == "") {
                    if (!isNotProvided(shipping.pincode)) return res.status(400).send({ status: false, message: "shipping pincode is required" })
                    data.address.shipping.pincode = shipping.pincode.trim()
                    if (!data.address.shipping.pincode) return res.status(400).send({ status: false, message: "shipping pincode is required" })
                    if (!isValidPincode(data.address.shipping.pincode)) return res.status(400).send({ status: false, message: "shipping pincode is not valid" })
                }
            }
            //_____________________________________

            if (billing) {

                let { street, city, pincode } = billing
                if (street || street == "") {
                    if (!isNotProvided(street)) return res.status(400).send({ status: false, message: "billing street address is required" })
                    data.address.billing.street = validTrim(street)
                    if (!data.address.billing.street) return res.status(400).send({ status: false, message: "billing street address is required" })
                }

                //_________________________
                if (city || city == "") {
                    if (!isNotProvided(city)) return res.status(400).send({ status: false, message: "billing city address is required" })
                    data.address.billing.city = validTrim(city)
                    if (!data.address.billing.city) return res.status(400).send({ status: false, message: "billing city address is required" })
                }

                //___________________________
                if (pincode || pincode == "") {
                    if (!isNotProvided(pincode)) return res.status(400).send({ status: false, message: "billing pincode is required" })
                    data.address.billing.pincode = validTrim(pincode)
                    if (!data.address.billing.pincode) return res.status(400).send({ status: false, message: "billing pincode is required" })
                    if (!isValidPincode(data.address.billing.pincode)) return res.status(400).send({ status: false, message: "billing pincode is not valid" })
                }
            }
        }
        if (files.length > 0) {

            if (files.length == 0) return res.status(400).send({ status: false, message: "provide a profile image" })
            if (!isValidImage(files[0].originalname)) return res.status(400).send({ status: false, message: "provide a valid image" })
            data.profileImage = await uploadFile(files[0])
        }

        let updateData = await userModel.findByIdAndUpdate(userId, data, { new: true })
        res.status(200).send({
                status: true,
                message: "Update user profile is successful",
                data: updateData,
            })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



module.exports = { createUser, loginUser, getUserDetails, updateUser }