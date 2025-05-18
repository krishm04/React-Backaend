const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const usersControllers = require('../Controllers/user-controllers');

const router = express.Router();

// ✅ Configure Multer for image upload
const fileUpload = multer({
    limits: { fileSize: 500000 }, // 500 KB
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/images'); // ✅ make sure this folder exists
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
});

// ✅ Get all users
router.get('/', usersControllers.getUser);

// ✅ Signup with validations and image upload
router.post(
    '/signup',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 6 })
    ],
    usersControllers.signUp
);

// ✅ Login
router.post('/login', usersControllers.login);

module.exports = router;
