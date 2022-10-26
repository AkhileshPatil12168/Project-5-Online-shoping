const express = require("express");
const multer = require("multer");
const route = require("./routes/routes");
const mongoose = require("mongoose");
require("dotenv").config()
const app = express();

app.use(express.json());
app.use(multer().any());

mongoose
  .connect(
    process.env.CONNECT_DATABASE,
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));

app.use('/', route)


app.listen(process.env.PORT, function () {
  console.log('Express app running on port ' + (process.env.PORT))
})
