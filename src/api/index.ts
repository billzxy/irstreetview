import axios from 'axios'

const hostname = "localhost";
const port = "8080";
const url = 'http://'+hostname+':'+port+'/api';

const api = axios.create({
    baseURL: url,
})

export const insertPano = payload => api.post(`/pano`, payload)
export const getAllPanos = () => api.get(`/panos/all`)
export const deletePanoById = id => api.delete(`/pano/${id}`)
export const getPanoById = id => api.get(`/pano/${id}`)

export const getPanoFileNameById = id => api.get(`/pano/fname/${id}`)
export const getPanoCoordById = id => api.get(`/pano/coord/${id}`)
export const getAllPanoIdAndCoord = () => api.get(`/panos/inc`)
export const getPanoAllAttrById = id => api.get(`/pano/allAttr/${id}`)
export const updateCalibrationById = (id, payload) => api.put(`/pano/cal/${id}`, payload)


const apis = {
    insertPano,
    getAllPanos,
    deletePanoById,
    getPanoById,

    getPanoFileNameById,
    getPanoCoordById,
    getAllPanoIdAndCoord,
    getPanoAllAttrById,
    updateCalibrationById
}

export default apis