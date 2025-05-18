const { validationResult } = require('express-validator');

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');


const getUser = async (req, res, next) => {
    let user;
    try {
        user = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError("Fetchin user failed,please try again later", 500);
        return next(error);
    }

    res.json({ users: user.map(user => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs paased , please check your data.", 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
    }
    catch (err) {
        const error = new HttpError("Signin up failed,please try again", 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError("User exists already,please login insted", 422);
        return next(error);
    }

    let hasedpassword ;
    try{
    hasedpassword = await bcrypt.hash(password,12);
    } catch(err){
        const error = new HttpError("Could not create user,please try again.", 500);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password : hasedpassword,
        places: []
    });
    try {
        await createdUser.save();
    }
    catch (err) {
        const error = new HttpError("Singin up failed , please try again.", 500);
        return next(error);
    }

    let token;
    try{
    token = jwt.sign({userId : createdUser.id , email : createdUser.email},
        process.env.JWT_KEY,
        {expiresIn : '1h'});
    } catch(err) {
        const error = new HttpError("Singin up failed , please try again.", 500);
        return next(error);
    }

    res.status(201).json({ userId: createdUser.id,email : createdUser.email,token : token});
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    }
    catch (err) {
        const error = new HttpError("Logging in failed,please try again", 500);
        return next(error);
    }

    if (!existingUser ) {
        const error = new HttpError("Invlid crdentails,could not log you in.", 403);
        return next(error);
    }

        let isValidPassword = false;
    try {
    isValidPassword = await bcrypt.compare(password,existingUser.password);
    }
    catch (err) {
        const error = new HttpError("Could not log you in, please check your crdentails and try again.", 500);
        return next(error);
    }

    if(!isValidPassword){
        const error = new HttpError("Invlid crdentails,could not log you in.", 403);
        return next(error);
    }

    try{
    token = jwt.sign({userId : existingUser.id , email : existingUser.email},
        process.env.JWT_KEY,
        {expiresIn : '1h'});
    } catch(err) {
        const error = new HttpError("Logging in failed , please try again.", 500);
        return next(error);
    }

    res.json({userId : existingUser.id , 
        email : existingUser.email,
    token : token});
};


exports.getUser = getUser;
exports.signUp = signUp;
exports.login = login;