const express = require('express')
const PanoCtrl = require('../controllers/pano-ctrl')
const router = express.Router()

router.post('/pano', PanoCtrl.createPano)
router.delete('/pano/:id', PanoCtrl.deletePano)
router.get('/pano/:id', PanoCtrl.getPanoById)
router.get('/panos/all', PanoCtrl.getPanos)

router.get('/pano/coord/:id', PanoCtrl.getPanoCoordById)
router.get('/pano/fname/:id', PanoCtrl.getPanoFileNameById)
router.get('/panos/inc', PanoCtrl.getAllPanosIdAndCoords)
router.get('/pano/allAttr/:id', PanoCtrl.getPanoAllAttrById)
router.put('/pano/cal/:id',PanoCtrl.updatePanoCalibration)

module.exports = router