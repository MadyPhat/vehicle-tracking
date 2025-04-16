import { Component, inject, input } from '@angular/core';
import { VehicleAnimator } from '../../helpers/vehicle-animator';
import { VehicleDataService } from '../../services/vehicle-data.service';
import { Vehicle, VehicleData } from '../../models/vehicle.model';

@Component({
  selector: 'app-simulation-controller',
  standalone: false,
  templateUrl: './simulation-controller.component.html',
  styleUrl: './simulation-controller.component.scss'
})
export class SimulationControllerComponent {
  map = input<L.Map>();
  animators: VehicleAnimator[] = [];
  timestamps: number[] = [];
  selectedTime = 0;
  currentTime = '';
  isPlaying = false;
  playbackSpeed = 1.0;
  private vehicleDataService = inject(VehicleDataService);
  private vehicleData: VehicleData;

  getMasterTimestamps(vehicles: Vehicle[]): number[] {
    const all = vehicles.flatMap(v => v.path.map(p => p.t));
    return Array.from(new Set(all)).sort((a, b) => a - b);
  }

  private getVehicleData() {
    this.vehicleDataService.getAllVehicles().subscribe(data => {
      this.vehicleData = data;
      const vehicles = this.vehicleData.vehicles;
      this.timestamps = this.getMasterTimestamps(vehicles);
      this.selectedTime = this.timestamps[0];
      if (!this.map()) return;
      
      vehicles.forEach(vehicle => {
        const map = this.map();
        if (!map) return;
        const animator = new VehicleAnimator(
          map, 
          vehicle,
          (timestamp: number) => this.updateTimeline(timestamp) // Updated callback type
        );
        animator.initMarker();
        this.animators.push(animator);
      });
    });
  }

  ngOnInit() {
    this.getVehicleData();
  }

  onPlay() {
    this.isPlaying = true;
    this.animators.forEach(a => {
      a.setSpeed(this.playbackSpeed);
      a.start();
    });
  }

  onPause() {
    this.isPlaying = false;
    this.animators.forEach(a => a.pause());
  }

  onReset() {
    this.isPlaying = false;
    this.selectedTime = this.timestamps[0];
    this.animators.forEach(anim => {
      anim.reset();
      anim.seekTo(this.selectedTime);
    });
  }

  onTimeChange(event: any) {
    const index = +event.target.value;
    this.selectedTime = this.timestamps[index];
    this.animators.forEach(anim => anim.seekTo(this.selectedTime));
  }

  onSpeedChange(event: any) {
    this.playbackSpeed = +event.target.value;
    this.animators.forEach(anim => anim.setSpeed(this.playbackSpeed));
  }

  updateTimeline(timestamp: number) {
    this.selectedTime = timestamp;
    if (this.selectedTime === this.timestamps[this.timestamps.length - 1]) {
      this.onReset();
    }
  }
}
