const mongoose = require("mongoose");

const emptyBody = value => {
    return Object.keys(value).length === 0
}

const validTrim = value => {
    return value.trim().toLowerCase()
}

const isNotProvided = value => {
    return value.trim() !== ""
}


const isValidWord = function (value) {
    return /^[a-zA-Z ]{2,20}$/.test(value)
}


const isValidEmail = (value) => {
    return /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(value)
}

const isValidPhone = (value) => {
    return /^[6-9]\d{9}$/.test(value)
}

const isValidPwd = (value) => {
    return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(value)

}

const isValidPincode = (value) => {
    return /^[1-9][0-9]{5}$/.test(value)
}

const isValidImage = (value) => {
    return /([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg)/.test(value)
}

const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value)
}

const isValidString = function (value) {
    if (value && value == undefined) return false
    if (typeof value == "string" && value.trim().length == 0) return false
    return true
}

const isValidTitle = (value) => {
    return /^[a-zA-Z0-9 ]{2,20}$/.test(value)
}

const isValidDisc = (value) => {
    return /^[a-zA-Z0-9#?!@$%&*- ]{10,30}$/.test(value)
}



const isValidSize = (value) => {
    return ["S", "XS", "M", "X", "L", "XXL", "XL"].includes(value)
}


const isValidStatus = function (status) {
    return ['pending', 'completed', 'cancelled'].indexOf(status) !== -1
}


module.exports = { emptyBody, isNotProvided, validTrim, isValidWord, isValidEmail, isValidPhone, isValidPwd, isValidPincode, isValidImage, isValidObjectId, isValidString, isValidSize, isValidTitle, isValidDisc, isValidStatus }