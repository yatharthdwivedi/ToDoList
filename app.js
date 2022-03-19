const express = require("express");

const app = express();
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://admin-yatharth:invisibleman@cluster0.xrek9.mongodb.net/todolistDB');
}


const itemsSchema = new mongoose.Schema({
    name: String
});

const Item  = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome"
});

const item2 = new Item({
    name : "Hit + to add"
});

const item3 = new Item({
    name: "<-- Hit this to delete"
});

const defaultItems =[item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"));

app.get("/", function(req, res) {
 
    Item.find({}, function(err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
         if (err) {
        console.log(err);
         } else {
        console.log("Updated");
        }
        })
        res.redirect("/");
        }
        
        else {
           res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });  
  
})

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err ,foundList) {
        if(err) {
            console.log(err);
        }
        else {
            if (!foundList) {
                // Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else{
                // Show existing list

                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    })

});


app.post("/", function(req, res) {

 const itemName = req.body.newItem;
 const listName = req.body.list;
 
 const item = new Item({
     name: itemName
 })

 if (listName === "Today") {
    item.save();
    res.redirect("/");
   
 } else {
     List.findOne({name: listName}, function(err, foundList) {
         if (err) {
             console.log(err);
         } else {
             foundList.items.push(item);
             foundList.save();
             res.redirect("/" + listName);
         }
     })     
 }
 
})

app.post("/delete", function(req, res) {
    let checkedItemId = req.body.check;
    checkedItemId = checkedItemId.trim();
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Deleted the item");
                res.redirect("/")
            }
        })
    }
    else {
        List.findOneAndUpdate({name: listName}, {$pull: {items : {_id : checkedItemId}}}, function(error, foundList) {
          if (error) {
             console.log(error);
          }
          else {
              res.redirect("/" + listName);
          }
        })
    }
 
})

// console.log(module.exports);
app.listen(3000, function() {
    console.log("Running");
})