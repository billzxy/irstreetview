const mongoose = require('mongoose')
const Schema = mongoose.Schema

const coord = new Schema(
    {
        lng: {type: Number, required: true},
        lat: {type: Number, required: true}
    }
)

const Pano = new Schema(
    {
        id: { type: String, required: true },
        filename: {type: String, required: true},
        coord: { type: coord, required: true },
        azimuth: { type: [], required: true },
    },
    { timestamps: true },
)

module.exports = mongoose.model('panos', Pano)