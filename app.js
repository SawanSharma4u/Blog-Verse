require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const request = require("request");
const https = require("https");
const res = require("express/lib/response");
const Post = require("./models/blog");
const User = require("./models/account");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const arr = {
    Content1: "Anyone can write on blog. Thought-leaders, journalists, experts, and individuals with unique perspectives share their thinking here. You’ll find pieces by independent writers from around the globe, stories we feature and leading authors, and smart takes on our own suite of blogs and publications.",
    Content2: "We’re creating a new model for digital publishing. One that supports nuance, complexity, and vital storytelling without giving in to the incentives of advertising. It’s an environment that’s open to everyone but promotes substance and authenticity. And it’s where deeper connections forged between readers and writers can lead to discovery and growth. Together with millions of collaborators, we’re building a trusted and vibrant ecosystem fueled by important ideas and the people who think about them.",
    Content3: "The best ideas can change who we are. DAILY JOURNAL is where those ideas take shape, take off, and spark powerful conversations. We’re an open platform where over 100 million readers come to find insightful and dynamic thinking. Here, expert and undiscovered voices alike dive into the heart of any topic and bring new ideas to the surface. Our purpose is to spread these ideas and deepen understanding of the world."
}

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://serene-savannah-36788.herokuapp.com/auth/google/home",
    useProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res)=>{
    Post.find({}, function(err, posts){
        if(!err){
            res.render("home", {
                Content1 : arr.Content1, 
                Content2 : arr.Content2,
                posts : posts
            });
        }
        else{
            console.log(err);
        }
    });
});

app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile"]
}));

app.get("/auth/google/home", 
  passport.authenticate('google', { failureRedirect: "/Login" }),
  function(req, res) {
    console.log("Successful authentication, redirect home.");
    res.redirect("/");
});

app.post("/", function(req, res){
    if(req.isAuthenticated()){
        res.redirect("/compose");
    }
    else{
        res.redirect("/Login");
    }
});

app.get("/compose", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("compose");
    }
    else{
        res.redirect("/Login");
    }
});

app.post("/compose", (req, res) => {
    if(req.isAuthenticated()){
        const post = new Post({
            title : req.body.postTitle,
            content : req.body.postContent
        });
        post.save(function(err){
            if(!err){
                res.redirect("/");
            }
        });
    }
    else{
        res.redirect("/Login");
    }
});

app.get("/posts/:postId", (req, res) => {
    if(req.isAuthenticated()){
        const requestedPostId = req.params.postId;
        Post.findOne({_id: requestedPostId}, (err, post) => {
            res.render("post", {
                date: post.postedAt,
                postTitle: post.title,
                Content: post.content
            });
        });
    }
    else{
        res.redirect("/Login");
    }
});

app.get("/delete/:id", (req, res) => {
    if(req.isAuthenticated()){
        const id = req.params.id;
        Post.deleteOne({_id: id}, err => {
            if(!err){
                res.redirect("/");
            }
            else{
                console.log(err);
            }
        });
    }
    else{
        res.redirect("/Login");
    }
});

app.get("/edit/:id", (req, res) => {
    if(req.isAuthenticated()){
        const id = req.params.id;
        Post.findOne({_id: id}, (err, post) => {
            if(!err){
                res.render("editBlog", {
                    post: post
                });
            }
            else{
                console.log("Error a rha");
            }
        });
    }
    else{
        res.redirect("/Login");
    }
});

app.post("/edit/:id", (req, res) => {
    if(req.isAuthenticated()){
        const id = req.params.id;
        const updatedPostTitle = req.body.postTitle;
        const updatedContent = req.body.postContent
        Post.updateOne({_id: id}, {title: updatedPostTitle, content: updatedContent}, err => {
            if(!err){
                res.redirect("/");
            }
            else{
                console.log(err);
            }
        });
    }
    else{
        res.redirect("/Login");
    }
});

app.get("/Login", (req, res) => {
    res.render("Login");
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/",
    failureRedirect:"/register"
}),function (req, res){
});

// app.post("/Login", (req, res)=>{
//     const username = req.body.username;
//     const password = req.body.password;
//     req.login({username: req.body.username, password: req.body.password}, function(err){
//         if(err){
//             console.log(err);
//         }
//         else{
//             passport.authenticate("local")(req, res, function(){
//                 res.redirect("/");
//             });
//         }
//     });
// });

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    User.register(new User({FName: req.body.FName, LName: req.body.LName, username: req.body.username, password: req.body.password}), req.body.password, (err, user) => {
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
            });
        }
    });
});

app.get("/about", function(req, res){
    res.render("about", {
        Content : arr.Content3,
        Content1 : arr.Content1, 
        Content2 : arr.Content2
    });
});

app.get("/contact", function(req, res){
    res.render("contact");
});

app.post("/contact", function(req, res){
    const firstName = req.body.fName;
    const lastName = req.body.lName;
    const email = req.body.email;
    
    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName
                }
            }
        ]
    };

    const jsonData = JSON.stringify(data);
    const url = process.env.API_KEY;
    const options = {
        method: "POST",
        auth: process.env.VALUE
    };
    
    const request = https.request(url,options, function(response){
        if(response.statusCode===200){
            res.render("response", {
                postTitle : "Awesome!",
                Content : firstName + " " + lastName + ", we've recieved your query, we will get back to you soon!"
            });
        }
        else{
            res.render("response", {
                postTitle : "Uh oh",
                Content : firstName + " " + lastName + ", there is a problem, please try again or contact the developer!"
            });
        }
        response.on("data", function(data){
            console.log(JSON.parse(data));
        });
    });

    request.write(jsonData);
    request.end();
});

app.get("/LogOut", (req, res) => {
    req.logout(function(err) {
        if (err){ 
            console.log(err); 
        }
        res.redirect("/");
    });
});

app.listen(process.env.PORT || 3000, function(req, res){
    console.log("Server is running");
});