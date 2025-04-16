import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletMapComponent } from './leaflet-map.component';
import { SimulationControllerComponent } from './simulation-controller/simulation-controller.component';



@NgModule({
  declarations: [
    LeafletMapComponent,
    SimulationControllerComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    LeafletMapComponent
  ]
})
export class LeafletMapModule { }
