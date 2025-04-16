export interface PathPoint {
  position: [number, number];
  speed: number;
  altitude?: number;
  timestamp: number;
  heading?: number;
}

export interface VehiclePathPoint {
  t: number;
  lat: number;
  lng: number;
  alt: number;
  heading: number;
  speed: number;
}

export interface Vehicle {
    id: string;
    type: string;
    path: VehiclePathPoint[];
}

export interface VehicleData {
  vehicles: Vehicle[];
}

export type VehicleTypeData = {
  id: string;
  type: string;
  path: VehiclePathPoint[];
};
