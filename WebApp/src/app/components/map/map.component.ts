import { jsDocComment } from '@angular/compiler';
import { Component, ElementRef, enableProdMode, OnInit, ViewChild } from '@angular/core';
import { DxVectorMapComponent } from 'devextreme-angular';

import * as mapsData from 'devextreme/dist/js/vectormap-data/usa.js';
import {
  DataFlatService,
  FeatureCollection as FeatureCollectionFlat,
} from 'src/app/services/data-flat.service';
import { DataService, FeatureCollection, getImageUrl } from 'src/app/services/data.service';

if (!/localhost/.test(document.location.host)) {
  enableProdMode();
}

// export interface MapClickEvent {
//   component: VectorMap; //The UI component's instance.
//   element: HTMLElement | jQuery; //	The UI component's container. It is an HTML Element or a jQuery Element when you use jQuery.
//   event: Event; // (jQuery or EventObject)	The event that caused the handler execution extended by the x and y fields. It is a EventObject or a jQuery.Event when you use jQuery.

//   target: Layer; // Element	The Layer Element object (if available).
// }

export class Type {
  id: number;
  name: string;
}

@Component({
  selector: 'app-map',
  providers: [DataService],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent {
  usaMap: any = mapsData.usa;
  devices: FeatureCollection;
  plant: FeatureCollection;
  projection: any;
  roomsData: FeatureCollectionFlat;
  buildingData: FeatureCollectionFlat;
  types: Type[];
  devicesSnapshot: FeatureCollection;
  tooltipContent: any;
  zoomFactor: number = 1;
  center: number[] = [0, 0];

  @ViewChild('map', { static: true }) map: DxVectorMapComponent;

  constructor(private service: DataService, private dataFlat: DataFlatService) {
    this.types = [
      { id: 1, name: 'luce' },
      { id: 2, name: 'antincendio' },
      { id: 3, name: 'esplosivo' },
      { id: 4, name: 'boh' },
      { id: 5, name: 'allarme' }
    ];

    this.devicesSnapshot = JSON.parse(JSON.stringify(service.getDevicesData()));
    this.devices = {
      features: [],
      type: 'FeatureCollection'
    };
    this.plant = {
      features: [],
      type: 'FeatureCollection'
    };
    this.setmap();
    this.roomsData = this.dataFlat.getRoomsData();
    this.buildingData = this.dataFlat.getBuildingData();
    this.projection = {
      to(coordinates) {
        return [coordinates[0] / 100, coordinates[1] / 100];
      },
      from(coordinates) {
        return [coordinates[0] * 100, coordinates[1] * 100];
      },
    };
  }

  setmap() {

    this.plant = this.service.basePlantData(0, 0, 0);
    this.plant = JSON.parse(JSON.stringify(this.plant));

    console.log(this.plant);
  }

  selectedDeviceSchanged(e) {
    const selectedIds = e.selectedRowKeys;

    this.devices.features = this.devicesSnapshot.features.filter(x => {
      return selectedIds.includes(x.properties.tipo);
    })
    this.devices = JSON.parse(JSON.stringify(this.devices));

    console.log(this.devices);
  }

  zoomFactorChange(e) {
    console.log('zoom', e);
    this.zoomFactor = e.zoomFactor;

    this.plant.features[0].properties.url = `http://localhost:60977/api/plant?centerX=${this.center[0] || 0}&centerY=${this.center[1] || 0}&zoom=${this.zoomFactor}`;

    this.plant = JSON.parse(JSON.stringify(this.plant));
  }

  centerChanged(e) {
    console.log('center', e);
    this.center = e.center;
    this.plant.features[0].geometry.coordinates = [-e.center[0], -e.center[1]];
    this.plant.features[0].properties.url = `http://localhost:60977/api/plant?centerX=${this.center[0] || 0}&centerY=${this.center[1] || 0}&zoom=${this.zoomFactor}`;

    this.plant = JSON.parse(JSON.stringify(this.plant));
  }

  mapClick(e: any) {
    console.log('event', e);
    console.log('map', this.map);
    if (e.target) {

    } else {
      this.addDeviceByClick(e)
    }
  }

  addDeviceByClick(e: any) {
    const mapHeightPixelY = (this.map['element'] as ElementRef).nativeElement.clientHeight;
    const mapHeightPixelX = (this.map['element'] as ElementRef).nativeElement.clientWidth;
    const unitHeght = (mapHeightPixelY / 180) * this.zoomFactor;
    const unitWidth = (mapHeightPixelX / 360) * this.zoomFactor;
    const xClicked = e.event.x - (mapHeightPixelX / 2) + this.center[0] //Math.floor(e.event.x / unitWidth) - 180
    const yClicked = Math.floor(e.event.y / unitHeght) - 90 - this.center[1];

    console.log(Math.floor(e.event.x / unitWidth) + ' ' + Math.floor(e.event.y / unitHeght));
    console.log(xClicked + ' ' + yClicked);

    this.devices.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [xClicked, -yClicked],
      },
      properties: {
        url: getImageUrl('boh'),
        tipo: 4,
      },
    });

    this.devices = JSON.parse(JSON.stringify(this.devices));
  }
}
