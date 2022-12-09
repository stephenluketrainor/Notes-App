//jshint esversion:6
//Specifying that the dotenv file will be used when running the app on our local server during development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");

const Item = require("./models/item").Item;
const List = require("./models/item").List;
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
console.log(process.env.ATLAS_URL);

// Setting up mongoose server
const mongoose = require("mongoose");
// URL not hardcoded as this will change while app is being used. new URL parser added to ensure older deprecated version will not be active
mongoose.connect(process.env.ATLAS_URL, { useNewUrlParser: true });
const db = mongoose.connection;
// Display error if issue with connection
db.on("error", (error) => console.error(error));
// Display success message if connection is established
db.once("open", () => console.log("Connected to mongoose"));

const item1 = new Item({
  name: "Eat breakfast",
});

const item2 = new Item({
  name: "Call Jimmy",
});

const item3 = new Item({
  name: "Do grocery shopping",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  // const day = date.getDate();

  Item.find(null, { name: 1, _id: 0 }, (err, items) => {
    if (items.length === 0) {
      Item.insertMany([item1, item2, item3], (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Sucessfully added");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.get("/:list", function (req, res) {
  const listName = _.capitalize(req.params.list);

  List.findOne({ name: listName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkItemName = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ name: checkItemName }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { name: checkItemName } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
