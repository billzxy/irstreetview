export type NeighborType = 'linear' | 'irregular' | 'circular'

export interface NeighborData {
  type: NeighborType
  map: string[]
}

export interface Coordination {
  lat: number
  lng: number
}

export interface PanoData {
  id: string
  filename: string
  coord: Coordination
  calibration: number
  neighborhood: string
  types: number[]
}
