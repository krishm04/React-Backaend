const express = require('express');

const {check} = require('express-validator');
const checkAuth = require('../middlerware/check-auth');


const router = express.Router();


const placeControllers = require('../Controllers/places-controller');
const fileUpload = require('../middlerware/file-uplaod');

router.get('/:pid',placeControllers.getplacesById);

router.get('/user/:uid',placeControllers.getPlaceByUser);

router.use(checkAuth)

router.post('/',fileUpload.single('image'),
    [
    check('title').not().isEmpty(),
    check('description').isLength({min: 5}),
    check('address').not().isEmpty()
],
    placeControllers.createPlace);

router.patch('/:pid',[
    check('title').not().isEmpty(),
    check('description').isLength({min: 5})
    ],
    placeControllers.updateplaceById);

router.delete('/:pid',placeControllers.deleteplaceById);
module.exports = router;