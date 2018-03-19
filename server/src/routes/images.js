import { Router } from 'express';
import Table from '../table';
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import multer from 'multer';
import s3Config from '../config';
import { join } from 'path';


let images = new Table('images');
let locations = new Table('locations');
let router = Router();

AWS.config.update(s3Config);
let s3 = new AWS.S3();

let upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'selfiestopimages',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        cacheControl: 'max-age=31536000',
        key: function (req, file, cb) {
            cb(null, Date.now() + '.jpg')
        }
    })
})

router.post('/', upload.single('image'), (req, res, next) => {  // Sends image to S3
    console.log(req.file.location);
    console.log(req.body.locationid);
    if (!req.body.locationid) {
        let picture = {
            image: req.file.location,
            userid: req.user.id,
            locationid: 141
        }
        images.insert(picture) // Sends S3 image path to database
            .then(() => {
                console.log('Insert Successful');
                res.sendStatus(201);
            }).catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });

    } else {
        let picture = {
            image: req.file.location,
            userid: req.user.id,
            locationid: req.body.locationid
        }

        images.insert(picture)
            .then(() => {
                res.sendStatus(201);
            }).catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    }
});

router.get('/', (req, res) => {
    let id = req.params.id;

    if (!id) {
        images.getAll() // GETS all images from database. Displays from newest to oldest.
            .then((images) => {
                res.json(images);
            }).catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    }
});

router.get('/:id/locationImages', (req, res) => {
    console.log(req.params.id);
    let id = req.params.id;
    images.getAllLocationImages(id) // GETS all images from a specific location.
        .then((images) => {
            console.log('Sent images');
            res.json(images);
        }).catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });

});

export default router;