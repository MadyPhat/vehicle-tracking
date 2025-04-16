import { AfterViewInit, Component, input } from '@angular/core';
import L from 'leaflet';

@Component({
  selector: 'app-leaflet-map',
  standalone: false,
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss'
})
export class LeafletMapComponent implements AfterViewInit {
  
  width = input<string>('100%');
  height = input<string>('100%');
  zoom = input<number>(7);

  private _map: L.Map | undefined;
  get map(): L.Map {
    if (!this._map) {
      this._map = L.map('map', {
        center: [0, 0],
        zoom: 10,
        minZoom: 1,
        maxZoom: 18,
        zoomControl: false,
      });
    }
    return this._map;
  }

  private initMap(): void {
    const cambodia = L.latLng(11.55, 104.92);
    this.map.setView(cambodia, this.zoom());
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }
}
