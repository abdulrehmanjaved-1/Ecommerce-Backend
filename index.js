// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;a

const express = require("express");
const server = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const cookieParser=require('cookie-parser');

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const connectToMongodb = require("./Connection");
const { CreateProduct } = require("./controller/Product");
const productsRouter = require("./routes/Products");
const categoriesRouter = require("./routes/Categories");
const brandsRouter = require("./routes/Brands");
const usersRouter = require("./routes/Users");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const OrdersRouter = require("./routes/Order");
require("dotenv").config();
const cors = require("cors");
const { User } = require("./model/User");
const { isAuth, sanitizeUser, cookieExtractor } = require("./serveices/Common");
const path=require('path');
const { Order } = require("./model/Order");







//Webhook
const endpointSecret = process.env.ENDPOINT_SECRET;

server.post('/webhook', express.raw({type: 'application/json'}), async(request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      const order=await Order.findById(paymentIntentSucceeded.metadata.orderId);
      order.paymentStatus='received';
      await order.save();
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET_KEY;
const PORT = process.env.PORT || 8000;

//connection for mongoDb atlas
const dataBase = "e-commerce";
const collection = "E-data";
const URL = process.env.URL;
connectToMongodb(URL, dataBase, collection);

//MiddleWares 
// server.use(express.raw({type: 'application/json'}))
server.use(express.static(path.resolve(__dirname,'build')))
server.use(cookieParser());
server.use(express.json());
server.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);
server.use(
  session({
    secret: 'keyboard cat',
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);
server.use(passport.authenticate("session"));

//Routes
server.use("/products", isAuth(), productsRouter.router);
server.use("/categories", isAuth(), categoriesRouter.router);
server.use("/brands", isAuth(), brandsRouter.router);
server.use("/user", isAuth(), usersRouter.router);
server.use("/auth", authRouter.router);
server.use("/carts", isAuth(), cartRouter.router);
server.use("/orders", isAuth(), OrdersRouter.router); 
//Mail-endpoint

//
server.get('*',(req,res)=>res.sendFile(path.resolve('build','index.html')))
//Passport Strategies
passport.use(
  "local",
  new LocalStrategy({usernameField:'email'},async function (email, password, done) {
    try {
      const user = await User.findOne({ email: email }).exec();
      if (!user) {
        return done(null, false, { message: "Invalid Credentials" }); // Note the "return"
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async function (err, hashedPassword) {
          if (err) {
            return done(err);
          }
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return done(null, false, { message: "Invalid Credentials" });
          } 
          const token = jwt.sign(sanitizeUser(user),process.env.JWT_SECRET_KEY);
            done(null, {id:user.id,role:user.role,token}); // Valid credentials
          
        }
      );
    } catch (error) {
      return done(error);
    }
  })
);

//JWT Strategy
passport.use(
  "jwt",
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id );

      if (user) {
        return done(null, sanitizeUser(user)); // User found, send sanitized user
      } else {
        return done(null, false); // User not found
      }
    } catch (error) {
      return done(error, false); // Error occurred
    }
  })
);

//This creates session req.user when being called through call backs
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});
//This creates session var req.user when being called through authorized requests
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});


//Payments
// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SERVER_KEY);
server.use(express.static("public"));
server.use(express.json());



server.post("/create-payment-intent", async (req, res) => {
  const { totalAmount,orderId } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount*100,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata:{
      orderId
    }
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});




server.listen(PORT, () => {
  console.log(`server connected at ${PORT}`);
});
