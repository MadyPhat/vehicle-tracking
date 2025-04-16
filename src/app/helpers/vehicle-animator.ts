import * as L from 'leaflet';
import { PathPoint, Vehicle } from '../models/vehicle.model';

// export const Icons = {
//     taxi: L.icon({ iconUrl: 'assets/icons/taxi.png', iconSize: [32, 32], iconAnchor: [16, 16] }),
//     bus: L.icon({ iconUrl: 'assets/icons/bus.png', iconSize: [32, 32], iconAnchor: [16, 16] }),
//     tuktuk: L.icon({ iconUrl: 'assets/icons/tuktuk.png', iconSize: [32, 32], iconAnchor: [16, 16] }),
//     plane: L.icon({ iconUrl: 'assets/icons/plane.svg', iconSize: [32, 32], iconAnchor: [16, 16] }),
//     car: L.icon({ iconUrl: 'assets/icons/car.svg', iconSize: [32, 32], iconAnchor: [16, 16] }),
//     vessel: L.icon({ iconUrl: 'assets/icons/vessel.png', iconSize: [32, 32], iconAnchor: [16, 16] }),
//     boat: L.icon({ iconUrl: 'assets/icons/boat.png', iconSize: [32, 32], iconAnchor: [16, 16] }),
// };

export class VehicleAnimator {
    marker: L.Marker;
    polyline: L.Polyline;
    private partialPolyline?: L.Polyline;
    currentIndex = 0;
    map: L.Map;
    path: PathPoint[];
    type: string = 'car';
    isPlaying = false;
    speedMultiplier = 1;
    animationFrame: any;
    private lastUpdateTime = 0;
    id: string;

    constructor(map: L.Map, vehicle: Vehicle, private onTimeUpdate?: (timestamp: number) => void) {
        this.map = map;
        this.type = vehicle.type;
        this.id = vehicle.id;
        this.path = vehicle.path
            .map(p => ({
                position: [p.lat, p.lng] as [number, number],
                speed: p.speed,
                altitude: p.alt,
                timestamp: p.t,
                heading: p.heading
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    initMarker() {
        const first = this.path[0];
        this.marker = L.marker(first.position, {
            icon: L.divIcon({
                html: `<div>${this.getIconHtml()}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                className: 'vehicle-icon'
            })
        }).addTo(this.map);

        this.partialPolyline = L.polyline([first.position], {
            color: 'red',
            weight: 3,
            opacity: 0.7
        }).addTo(this.map);
    }

    private updateMarkerRotation(heading: number) {
        const icon = this.marker.getIcon();
        if (icon && icon instanceof L.DivIcon) {
            icon.options.html = `
            <div style="
              width: 32px;
              height: 32px;
              display: flex;
              justify-content: center;
              align-items: center;
              transform: rotate(${heading}deg);
              transform-origin: center;
              transition: transform 0.2s ease-out;
            ">
              ${this.getIconHtml()}
            </div>`;
            this.marker.setIcon(icon);
        }
    }

    start() {
        this.isPlaying = true;
        this.animate();
    }

    pause() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationFrame);
    }

    reset() {
        this.pause();
        this.currentIndex = 0;
        this.marker.setLatLng(this.path[0].position);

        if (this.partialPolyline) {
            this.partialPolyline.setLatLngs([this.path[0].position]);
        }
    }

    setSpeed(multiplier: number) {
        this.speedMultiplier = multiplier;
    }

    seekTo(timestamp: number) {
        const idx = this.findClosestIndex(timestamp);
        if (idx !== -1) {
            this.currentIndex = idx;
            this.marker.setLatLng(this.path[idx].position);
            if (this.path[idx].heading !== undefined) {
                this.updateMarkerRotation(this.path[idx].heading);
            }

            if (this.partialPolyline) {
                const partialPath = this.path.slice(0, idx + 1).map(p => p.position);
                this.partialPolyline.setLatLngs(partialPath);
            }
        }
    }

    private findClosestIndex(timestamp: number): number {
        // Binary search for efficient timestamp lookup
        let low = 0, high = this.path.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (this.path[mid].timestamp < timestamp) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return high;
    }

    private getIconHtml(): string {
        switch (this.type) {
            case 'plane':
                return '<img src="assets/icons/plane.svg" width="32" height="32">';
            case 'car':
                return '<img src="assets/icons/car.svg" width="32" height="32">';
            case 'boat':
                return '<img src="assets/icons/boat.png" width="32" height="32">';
            default:
                return '<div style="width:32px;height:32px;background:#333;border-radius:50%"></div>';
        }
    }

    private calculateHeading(currentPos: [number, number], nextPos: [number, number]): number {
        const dx = nextPos[1] - currentPos[1];
        const dy = nextPos[0] - currentPos[0];
        // Calculate bearing and adjust for map orientation (90° offset and flip Y axis)
        return (Math.atan2(-dy, dx) * 180 / Math.PI + 90 + 360) % 360;
      }

    animate() {
        if (!this.isPlaying) return;

        const now = performance.now();
        if (now - this.lastUpdateTime < 16) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
            return;
        }
        this.lastUpdateTime = now;

        const nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.path.length) return;

        const current = this.path[this.currentIndex];
        const next = this.path[nextIndex];

        const duration = (next.timestamp - current.timestamp) * 100 / this.speedMultiplier;
        const start = performance.now();

        const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const lat = current.position[0] + t * (next.position[0] - current.position[0]);
            const lng = current.position[1] + t * (next.position[1] - current.position[1]);
            const currentPosition: [number, number] = [lat, lng];
            this.marker.setLatLng(currentPosition);

            // Calculate heading based on direction to next position
            const heading = this.calculateHeading(currentPosition, next.position);
            this.updateMarkerRotation(heading);

            if (this.partialPolyline) {
                const currentPath = this.partialPolyline.getLatLngs() as L.LatLng[];
                const newPath = [...currentPath.slice(0, this.currentIndex + 1), currentPosition];
                this.partialPolyline.setLatLngs(newPath);
            }

            if (t < 1) {
                this.animationFrame = requestAnimationFrame(step);
            } else {
                this.currentIndex++;
                const newTime = this.path[this.currentIndex]?.timestamp;
                if (this.onTimeUpdate && newTime) this.onTimeUpdate(newTime);
                this.animate();
            }
        };

        this.animationFrame = requestAnimationFrame(step);
    }
}
