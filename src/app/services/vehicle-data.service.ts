import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { VehicleData, PathPoint, VehicleTypeData } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleDataService {
  private dataUrl = 'assets/data/vehicles_cambodia_dense.json';
  private cachedData$?: Observable<VehicleData>;

  constructor(private http: HttpClient) {}

  getAllVehicles(): Observable<VehicleData> {
    if (!this.cachedData$) {
      this.cachedData$ = this.http.get<VehicleData>(this.dataUrl).pipe(
        shareReplay(1)
      );
    }
    return this.cachedData$;
  }

  getVehiclesByType(type: keyof VehicleData): Observable<VehicleTypeData[]> {
    return this.getAllVehicles().pipe(
      map(data => data[type])
    );
  }

  getVehicleById(id: string): Observable<VehicleTypeData | undefined> {
    return this.getAllVehicles().pipe(
      map(data => {
        for (const vehicleType in data) {
          const found = data[vehicleType as keyof VehicleData].find(v => v.id === id);
          if (found) return found;
        }
        return undefined;
      })
    );
  }

  getVehiclePath(id: string): Observable<PathPoint[] | undefined> {
    return this.getVehicleById(id).pipe(
      map(vehicle => vehicle?.path.map(p => ({
        position: [p.lat, p.lng] as [number, number],
        speed: p.speed,
        altitude: p.alt,
        timestamp: p.t,
        heading: p.heading
      })))
    );
  }
}