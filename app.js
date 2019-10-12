var express = require("express")
var bodyParser = require("body-parser")
var app = express()
var mongoose = require("mongoose")
var passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    Campground  = require("./models/campgrounds"),
    Comment     = require("./models/comment"),
    User        = require("./models/user")
var seedDB = require("./seed")


mongoose.connect("mongodb://localhost:27017/yelpcamp", {useNewUrlParser: true})

app.set("view-engine","ejs")

app.use(bodyParser.urlencoded({extended: true}))

seedDB();

app.use(require("express-session")({
    secret: "COE-2 is shit!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
})

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/',function(req,res){
    res.render("landing.ejs",{currentUser: req.user});
})

app.get("/campgrounds",function(req,res){
    Campground.find({},function(err,campgrounds){
        if(err){
            console.log(err)
        } else {
            res.render("campgrounds.ejs",{campgrounds:campgrounds,currentUser: req.user})
        }
    })
    
})
app.get("/campgrounds/new",function(req,res){
	res.render("new.ejs",{currentUser: req.user})
})

app.get("/campgrounds/:id",function(req,res){
    Campground.findById(req.params.id).populate("comments").exec(function(err,campground){
        if(err){
            console.log(err)
        } else {
            res.render("campground.ejs",{campground:campground,currentUser: req.user})
        }
    })
})

app.post("/campgrounds",function(req,res){
    var name = req.body.name
	var image = req.body.image
    var desc = req.body.description
	var newC={
		name: name,
		image: image,
        description: desc
	}
    Campground.create(newC,function(err, campground){
            if(err){
                console.log(err)
            } else {
                console.log("new entry")
                console.log(campground)

            }
        })
	res.redirect("/campgrounds")
})

app.get("/campgrounds/:id/comments/new",isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err)
        } else {
            res.render("newcomment.ejs",{campground:campground,currentUser: req.user})
        }
    })
})

app.post("/campgrounds/:id/comments",isLoggedIn,function(req,res){
    // console.log(req.body.comment)
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err)
        } else {
            Comment.create(req.body.comment,function(err,comment){
                campground.comments.push(comment);
                campground.save();
                console.log("Created new comment++");
                res.redirect("/campgrounds/"+req.params.id)
            })
        }
    })
})


app.get("/register", function(req, res){
   res.render("register.ejs",{currentUser: req.user}); 
})

app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register.ejs",{currentUser: req.user});
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/campgrounds"); 
        });
    });
})

app.get("/login", function(req, res){
   res.render("login.ejs",{currentUser: req.user}); 
})

app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
})

app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/campgrounds");
})


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(3000, function(){
    console.log("The app has started!!");
})