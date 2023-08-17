const { User } = require("../model/User");
const crypto = require("crypto");
const { sanitizeUser, sendMail } = require("../serveices/Common");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator"); // Import necessary dependencies

exports.createUser = async (req, res) => {
  try {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      'sha256',
      async function (err, hashedPassword) {
        try {
          const user = new User({ ...req.body, password: hashedPassword, salt });
          const doc = await user.save();
          req.login(sanitizeUser(doc), (err) => {
            // this also calls serializer and adds to session
            if (err) {
              res.status(400).json(err);
            } else {
              const token = jwt.sign(sanitizeUser(doc), process.env.JWT_SECRET_KEY);
              res
                .cookie('jwt', token, {
                  expires: new Date(Date.now() + 3600000),
                  httpOnly: true,
                })
                .status(201)
                .json({ id: doc.id, role: doc.role, token }); // Send all the required data in a single response
            }
          });
        } catch (error) {
          res.status(400).json(error);
        }
      }
    );
  } catch (err) {
    res.status(400).json(err);
  }
};



exports.loginUser = async (req, res) => {
  const user=req.user;
  res
    .cookie("jwt", user.token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    })
    .status(201)
    .json({id:user.id,role:user.role});
};
exports.checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  }else{
    res.sendStatus(401);
  }
};
exports.resetPasswordRequest = async (req, res) => {
  const resetPage="http://localhost:8080/reset-password"
  const subject="reset password for e-commerce";
  const html=`<p>Click <a href='${resetPage}'>here</a> to reset password</p>`
  if (req.body.email) {
   const response=await sendMail({to:req.body.email,subject,html});
   res.send(response)
  }else{
    res.sendStatus(400);
  }
};
