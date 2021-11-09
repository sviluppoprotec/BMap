import { jsDocComment } from '@angular/compiler';
import { AfterContentInit, Component, ElementRef, enableProdMode, OnInit, ViewChild } from '@angular/core';
import { DxVectorMapComponent } from 'devextreme-angular';

import * as mapsData from 'devextreme/dist/js/vectormap-data/usa.js';
import { Observable, zip } from 'rxjs';
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
export class MapComponent implements AfterContentInit {
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
  selectedIds: number[];
  moveWithoutReload = false;
  forcedX = 0;
  forcedY = 0;

  centerChangedRequested: boolean = false;
  requestX = 0;
  requestY = 0;

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
    
    this.projection = {
      to(coordinates) {
        return [coordinates[0] / 100, coordinates[1] / 100];
      },
      from(coordinates) {
        return [coordinates[0] * 100, coordinates[1] * 100];
      },
    };


  }

  ngAfterContentInit(): void {
  }

  setmap() {
    this.plant = this.service.basePlantData(0, 0, 0);
    this.plant = JSON.parse(JSON.stringify(this.plant));

    console.log(this.plant);
  }

  selectedDeviceSchanged(e) {
    console.log('selectedDeviceSchanged', e);
    this.selectedIds = e.selectedRowKeys;
    const currSelectedKey = e.currentSelectedRowKeys;

    // this.devices.features = this.devicesSnapshot.features.filter(x => {
    //   return selectedIds.includes(x.properties.tipo);
    // })

    this.service.getDevicesData$(currSelectedKey, this.requestX, this.requestY, this.zoomFactor).subscribe(x => {
      x.features.forEach(y => {
        const geoCoords = this.toGeoUnit(y.geometry.coordinates[0], y.geometry.coordinates[1]);
        y.geometry.coordinates[0] = geoCoords.x;
        y.geometry.coordinates[1] = geoCoords.y;
        this.devices.features.push(y)
      });
      this.devices = JSON.parse(JSON.stringify(this.devices));
      console.log('selectedDeviceSchanged', this.devices);
    });
  }

  resetAllDevices() {
    if(!this.selectedIds || !this.selectedIds.length){
      return
    }
    const list: Observable<FeatureCollection>[] = [];
    this.selectedIds.forEach(x => {
      list.push(
        this.service.getDevicesData$(x, this.requestX, this.requestY, this.zoomFactor));
    });
    this.devices.features = [];
    zip(...list).subscribe(x => {
      x.forEach(y => {
        y.features.forEach(z => {
          const geoCoords = this.toGeoUnit(z.geometry.coordinates[0], z.geometry.coordinates[1]);
          z.geometry.coordinates[0] = geoCoords.x;
          z.geometry.coordinates[1] = geoCoords.y;
          this.devices.features.push(z)
        });
      });
      this.devices = JSON.parse(JSON.stringify(this.devices));
      console.log('selectedDeviceSchanged', this.devices);
    });


  }

  zoomFactorChange(e) {
    console.log('zoom', e);
    this.zoomFactor = e.zoomFactor;

    this.plant.features[0].properties.url = `/api/plant/map?centerX=${this.center[0] || 0}&centerY=${this.center[1] || 0}&zoom=${this.zoomFactor}`;

    this.plant = JSON.parse(JSON.stringify(this.plant));
    this.devices = JSON.parse(JSON.stringify(this.devices));
  }

  forcePosition() {

    console.log('forcePosition', this.forcedX, this.forcedY);
    this.plant.features[0].geometry.coordinates = [this.forcedX, this.forcedY];
    this.plant = JSON.parse(JSON.stringify(this.plant));
  }

  centerChanged(e) {

    console.log('map_b', this.map);
    console.log('center', e);
    this.center = e.center;
    // this.forcedX = e.center[0];
    // this.forcedY = e.center[1];


    if (this.moveWithoutReload && this.center[0] != 0 && this.center[1] != 0) {
      return;
    }

    if (this.centerChangedRequested == true) {
      console.log('center', this.requestX, this.requestY);
      console.log(`/api/plant/map?centerX=${this.requestX || 0}&centerY=${this.requestY || 0}&zoom=${this.zoomFactor}`);
      this.plant.features[0].properties.url = `/api/plant/map?centerX=${this.requestX || 0}&centerY=${this.requestY || 0}&zoom=${this.zoomFactor}`;

      this.plant = JSON.parse(JSON.stringify(this.plant));
      this.resetAllDevices();
    }

    if (this.centerChangedRequested == false) {
      const pixelCoords = this.toPixelUnit();
      this.center = [0, 0];
      this.requestX += pixelCoords.x;
      this.requestY += pixelCoords.y;
      this.centerChangedRequested = true;
      return;
    }

    this.centerChangedRequested = false;
    console.log('map_a', this.map);
  }

  toPixelUnit(): { x: number; y: number } {
    const mapHeightPixelY = (this.map['element'] as ElementRef).nativeElement.clientHeight;
    const mapHeightPixelX = (this.map['element'] as ElementRef).nativeElement.clientWidth;
    const unitHeght = (mapHeightPixelY / 180) * this.zoomFactor;
    const unitWidth = (mapHeightPixelX / 360) * this.zoomFactor;
    const x = (-this.center[0] * unitWidth * 0.7);
    const y = (-this.center[1] * unitHeght * 0.7);
    return { x, y }
  }

  toGeoUnit(xPixel: number, yPixel: number): { x: number; y: number } {
    const mapHeightPixelY = (this.map['element'] as ElementRef).nativeElement.clientHeight;
    const mapHeightPixelX = (this.map['element'] as ElementRef).nativeElement.clientWidth;
    const unitHeght = (mapHeightPixelY / 180) * this.zoomFactor;
    const unitWidth = (mapHeightPixelX / 360) * this.zoomFactor;
    const x = ((xPixel - (mapHeightPixelX / 2)) / unitWidth);
    const y = ((yPixel - (mapHeightPixelY / 2)) / unitHeght);
    return { x, y }
  }

  mapClick(e: any) {
    console.log('event', e);
    console.log('map', this.map);
    if (e.target) {

    } else {

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
