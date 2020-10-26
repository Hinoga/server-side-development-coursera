const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../authenticate");
const cors = require("./cors");

const Favorites = require("../models/favorite");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user._id })
      .populate("dishes")
      .populate("user")
      .then(
        favorite => {
          if (favorite != null && favorite.dishes.length) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite.dishes);
          } else {
            err = new Error(
              "User " + req.user._id + " do not have favorite dishes"
            );
            err.status = 404;
            return next(err);
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (req.body.length) {
      Favorites.find({ user: req.user._id })
        .then(
          favorite => {
            if (favorite != null && favorite.length) {
              var newDishes = [...favorite.dishes, ...req.body];
              Favorites.replaceOne(
                { _id: favorite._id },
                { $set: { dishes: newDishes, user: req.user._id } }
              ).then(
                favorite => {
                  Favorites.findById(favorite._id)
                    .populate("dishes")
                    .populate("user")
                    .then(favorite => {
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(favorite.dishes);
                    });
                },
                err => next(err)
              );
            } else {
              favorite = new Favorites({ user: req.user._id });
              favorite.dishes.push(res.body);
              favorite.save().then(
                favorite => {
                  Favorites.findById(favorite._id)
                    .populate("dishes")
                    .populate("user")
                    .then(favorite => {
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(favorite.dishes);
                    });
                },
                err => next(err)
              );
            }
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  })
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /favorites");
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Favorite.updateOne({ user: req.user._id }, { $pullAll: { dishes: [] } })
        .then(
          favorite => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite.dishes);
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  );

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end("GET operation not supported on /favorites/" + req.params.dishId);
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Favorites.find({ user: req.user._id })
        .then(
          favorite => {
            if (favorite != null) {
              favorite.dishes.push(res.params.dishId);
              Favorites.replaceOne(
                { _id: favorite._id },
                { $set: favorite }
              ).then(
                favorite => {
                  Favorites.findById(favorite._id)
                    .populate("dishes")
                    .populate("user")
                    .then(favorite => {
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(favorite.dishes);
                    });
                },
                err => next(err)
              );
            } else {
              favorite = new Favorites({ user: req.user._id });
              favorite.dishes.push(res.params.dishId);
              favorite.save().then(
                favorite => {
                  Favorites.findById(favorite._id)
                    .populate("dishes")
                    .populate("user")
                    .then(favorite => {
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(favorite.dishes);
                    });
                },
                err => next(err)
              );
            }
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /favorites/" + res.params.dishId);
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Favorite.updateOne(
        { user: req.user._id },
        { $pullAll: { dishes: [res.params.dishId] } }
      )
        .then(
          favorite => {
            Favorites.findById(favorite._id)
              .populate("dishes")
              .populate("user")
              .then(favorite => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite.dishes);
              });
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  );

module.exports = favoriteRouter;
