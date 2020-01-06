import axios from 'axios'
import mockedPanos from '../mocks/panos.json'
import mockedNeighbors from '../mocks/neighbors.json'

import {PanoData, NeighborData} from './types'
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

// This issue should be gone when line 118 is fixed
// @ts-ignore
let typedNeighbors = mockedNeighbors as {[key: string]: NeighborData}
let typedPanos = mockedPanos as PanoData[]

function getDataFromJSONArray(data: PanoData[], query: Array<keyof PanoData>, id?: string) {
  if (!id) {
    //case when api resembles to 'getAllBlaBlah'
    for (let i = 0; i < data.length; i++) {
      const resultArr = []
      for (let param of query) {
        resultArr.push(data[i][param])
      }
      return resultArr
    }
  }
  for (let i = 0; i < data.length; i++) {
    // case when api resembles "getBlahBlahById"
    if (data[i]['id'] === id) {
      // case specific for "getAllAttrById"
      // TODO: why can we just return data[i], why do we need to pick properties?
      if (query.length === 0) {
        return data[i]
      }
      const result: Partial<PanoData> = {}
      for (let param of query) {
        // TODO: fix this
        // @ts-ignore
        result[param] = data[i][param]
      }
      return result
    }
  }
}

function getMatrixNeighbors() {
  //used for getting irregular neighbor hood neighbors
}

function getNeighbors(id: string, nhood: string | string[]) {
  if (Array.isArray(nhood)) {
    //in the case of a junction
    const result: string[] = []
    for (let hood of nhood) {
      let arr = getTwoNeighbors(id, typedNeighbors[hood])
      // TODO: why pushing like this?
      Array.prototype.push.apply(result, arr)
    }
    return result
  } else {
    //linear or circular
    let arr = getTwoNeighbors(id, typedNeighbors[nhood])
    return arr
  }
}

function getTwoNeighbors(id: string, hood: NeighborData): string[] {
  if (hood.map.length < 2) {
    return []
  }
  switch (hood.type) {
    case 'linear':
      for (var i = 0; i < hood.map.length; i++) {
        if (id === hood.map[i]) {
          if (i === 0)
            //first one, return second as neighbor
            return [hood.map[1]]
          else if (i === hood.map.length - 1)
            //last one, return the second to the last as neighbor
            return [hood.map[hood.map.length - 2]]
          //Otherwise, return the neighboring two
          return [hood.map[i - 1], hood.map[i + 1]]
        }
      }
      break

    case 'circular':
      for (var i = 0; i < hood.map.length; i++) {
        if (id === hood.map[i]) {
          if (i === 0)
            //first one, return last and second as neighbor
            return [hood.map[1], hood.map[hood.map.length - 1]]
          else if (i === hood.map.length - 1)
            //last one, return the second to the last and first as neighbor
            return [hood.map[hood.map.length - 2], hood.map[0]]
          //Otherwise, return the neighboring two
          return [hood.map[i - 1], hood.map[i + 1]]
        }
      }
      break

    case 'irregular':
      // TODO: if the signature is totally different, e.g. array vs object
      // then it should have a different name instead of map
      // @ts-ignore
      return hood.map[id]
    default:
      console.log('[getTwoNeighbors] unexpected fallthrough of default case')
      break
  }
  return []
}

// Should use superagent to mock when we have time
export const getPanoCoordById = (id: string) =>
  Promise.resolve({data: {data: getDataFromJSONArray(typedPanos, ['coord'], id)}})
//export const getAllPanoIdAndCoord = () => Promise.resolve({ data: { data: getDataFromJSON(typedPanos,["id", "coord"]) } })
export const getAllPanoIdAndCoord = () => Promise.resolve({data: {data: typedPanos}})
export const getPanoAllAttrById = (id: string) =>
  Promise.resolve({data: {data: getDataFromJSONArray(typedPanos, [], id)}})
export const getPanoFileNameById = (id: string) =>
  Promise.resolve({data: {data: getDataFromJSONArray(typedPanos, ['filename'], id)}})
export const getNeighborsById = (id: string, neighborhood: string | string[]) =>
  Promise.resolve({data: {data: getNeighbors(id, neighborhood)}})

const apis = {
  //insertPano,
  //getAllPanos,
  //deletePanoById,
  //getPanoById,
  //updateCalibrationById,

  getPanoFileNameById,
  getPanoCoordById,
  getAllPanoIdAndCoord,
  getPanoAllAttrById,
  getNeighborsById
}

export default apis
