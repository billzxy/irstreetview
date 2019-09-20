import axios from 'axios'
import mockedPanos from '../mocks/panos.json'
import mockedNeighbors from '../mocks/neighbors.json'

/*
const hostname = "localhost";
const port = "8080";
const url = 'http://' + hostname + ':' + port + '/api';

const api = axios.create({
    baseURL: url,
})

export const insertPano = payload => api.post(`/pano`, payload)
export const getAllPanos = () => api.get(`/panos/all`)
export const deletePanoById = id => api.delete(`/pano/${id}`)
export const getPanoById = id => api.get(`/pano/${id}`)

export const getPanoCoordById = (id) => api.get(`/pano/coord/${id}`)
export const getPanoFileNameById = id => api.get(`/pano/fname/${id}`)
export const getPanoAllAttrById = (id) => api.get(`/pano/allAttr/${id}`)
export const updateCalibrationById = (id, payload) => api.put(`/pano/cal/${id}`, payload)
*/

function getDataFromJSONArray(data, query, id?){
    if(!id){//case when api resembles to 'getAllBlaBlah'
        for(var i=0; i<data.length; i++){
            var resultArr = [];
            for(let param of query){
                resultArr.push(data[i][param]);
            }
            return resultArr;
        }
    }
    for(var i=0; i<data.length; i++){//case when api resembles "getBlahBlahById"
        if(data[i]["id"]===id){
            if(query.length===0)//case specific for "getAllAttrById"
                return data[i];
            var result = {};
            for(let param of query){
                result[param]=data[i][param];
            }
            return result;
        }
    }
}

function getTwoNeighbors(id, nhood){
    let hood = mockedNeighbors[nhood]
    if(hood.length<2)
        return [];
    for(var i=0; i<hood.length; i++){
        if(id===hood[i][id])
            if(i===0) //first one, return second as neighbor
                return [ hood[1] ];
            else if(i===hood.length-1) //last one, return the second to the last as neighbor 
                return [ hood[hood.length-2] ];
            //Otherwise, return the neighboring two
            return [ hood[i-1], hood[i+1] ];
    }
}

// Should use superagent to mock when we have time
export const getPanoCoordById = (id) => Promise.resolve({ data: { data: getDataFromJSONArray(mockedPanos,["coord"], id) } })
//export const getAllPanoIdAndCoord = () => Promise.resolve({ data: { data: getDataFromJSON(mockedPanos,["id", "coord"]) } })
export const getAllPanoIdAndCoord = () => Promise.resolve({ data: { data: mockedPanos } })
export const getPanoAllAttrById = (id) => Promise.resolve({ data: { data: getDataFromJSONArray(mockedPanos,[], id) } })
export const getPanoFileNameById = (id) => Promise.resolve({ data: { data:  getDataFromJSONArray(mockedPanos,["filename"], id) } })
export const getNeighborsById = (id, neighborhood) => Promise.resolve({ data: { data: getTwoNeighbors(id, neighborhood) } })

const apis = {
    //insertPano,
    //getAllPanos,
    //deletePanoById,
    //getPanoById,
    //updateCalibrationById,

    getPanoFileNameById,
    getPanoCoordById,
    getAllPanoIdAndCoord,
    getPanoAllAttrById
}

export default apis