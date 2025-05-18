const fs = require('fs');
const { validationResult } = require('express-validator');
const mongoose = require("mongoose");

const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');
const getCoordsForAddress = require('../utils/location')



const getplacesById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError("Something went wrong, colud not find a place.", 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find a place for provided id.', 404);
        return next(error);
    }
    res.json({ place: place.toObject({ getters: true }) });
}

const getPlaceByUser = async (req, res, next) => {
    const userID = req.params.uid;
    // let places;
    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userID).populate('places');
    } catch (err) {
        const error = new HttpError("Fatching place failed,please try again.", 500);
        return next(error);
    }

    // if(1places || places.length === 0 )
    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return next(new HttpError('Could not find a place for provided id.', 404)
        );
    }
    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) }); // => { place } => { place: place }
}

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid inputs paased , please check your data.", 422));
    }

    const { title, description, image, address } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: req.file.path,
        creator : req.userData.userId
    });

    let user;
    try {
        user = await User.findById(req.userData.userId);
    }
    catch (err) {
        const error = new HttpError("Creating palce failed , please try again.", 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError("Could not find user for provided id", 404);
        return next(error);
    }

    console.log(user);

    try {
        const sses = await mongoose.startSession();
        sses.startTransaction();
        await createdPlace.save({ session: sses });
        user.places.push(createdPlace);
        await user.save({ session: sses });
        await sses.commitTransaction();
    }
    catch (err) {
        console.error('❌ Error while saving place:', err.message);
        const error = new HttpError("Creating palce failed , please try again.", 500);
        return next(error);
    }
    res.status(201).json({ place: createdPlace });

};

const updateplaceById = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid inputs paased , please check your data.", 422));
    }
    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError("Something went wrong, colud not find a place.", 500);
        return next(error);
    }

    if(place.creator.toString() !==  req.userData.userID){
        const error = new HttpError("You are not allowed to edit this place.", 401);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    }
    catch (err) {
        const error = new HttpError("Something went wrong, colud not find a place.", 500);
        return next(error);
    }
    res.status(200).json({ place: place.toObject({ getters: true }) });
};
const deleteplaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError("Something went wrong, colud not delete a place.", 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError("Colud not find place for this id", 404);
        return next(error);
    }

    if(place.creator.id !== req.userData.userID){
        const error = new HttpError("You are not allowed to delete this place.", 401);
        return next(error);
    }
    const imagePath = place.image;

    try {
        const sses = await mongoose.startSession();
        sses.startTransaction();
        await place.deleteOne({ session: sses });
        place.creator.places.pull(place);
        await place.creator.save({ session: sses });
        await sses.commitTransaction();
    } catch (err) {
        const error = new HttpError("Something went wrong, colud not delete a place.", 500);
        return next(error);
    }

    fs.unlink(imagePath, err => {
        console.log(err)
    });
    res.status(200).json({ message: 'Deleted Place.' });
};

exports.updateplaceById = updateplaceById;
exports.deleteplaceById = deleteplaceById;
exports.getplacesById = getplacesById;
exports.getPlaceByUser = getPlaceByUser;
exports.createPlace = createPlace;