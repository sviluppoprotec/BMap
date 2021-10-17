import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export class FeatureCollection {
  type: string;
  features: Feature[];
}

export class Feature {
  type: string;
  properties: FeatureProperty;
  geometry: FeatureGeometry;
}

export class FeatureProperty {
  tipo: number;
  url: string;
}

export class FeatureGeometry {
  type: string;
  coordinates: number[];
}

export function getImageUrl(name): string {
  return `webapp/src/assets/images/VectornMap/${name}.png`;
}


function basePlantData(): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          url: '/api/plant',
          tipo: 0,
        },
      }
    ]
  }
}

let devicesData: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {
        url: '/api/plant',
        tipo: 0,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.007118, 40.71455],
      },
      properties: {
        url: getImageUrl('luce'),
        tipo: 1,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-60, 60],
      },
      properties: {
        url: getImageUrl('antincendio'),
        tipo: 2,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-50, 60],
      },
      properties: {
        url: getImageUrl('luce'),
        tipo: 1,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {
        url: getImageUrl('luce'),
        tipo: 1,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [50, -50],
      },
      properties: {
        url: getImageUrl('antincendio'),
        tipo: 2,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 50],
      },
      properties: {
        url: getImageUrl('luce'),
        tipo: 1,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [50, 0],
      },
      properties: {
        url: getImageUrl('luce'),
        tipo: 1,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-50, 0],
      },
      properties: {
        url: getImageUrl('allarme'),
        tipo: 5,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, -50],
      },
      properties: {
        url: getImageUrl('luce'),
        tipo: 1,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 25],
      },
      properties: {
        url: getImageUrl('antincendio'),
        tipo: 2,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [25, 0],
      },
      properties: {
        url: getImageUrl('luce'),
        tipo: 1,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-25, 0],
      },
      properties: {
        url: getImageUrl('esplosivo'),
        tipo: 3,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, -25],
      },
      properties: {
        url: getImageUrl('esplosivo'),
        tipo: 3,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [70, 0],
      },
      properties: {
        url: getImageUrl('boh'),
        tipo: 4,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 70],
      },
      properties: {
        url: getImageUrl('antincendio'),
        tipo: 2,
      },
    },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private readonly httpClient: HttpClient) { }

  getDevicesData(): FeatureCollection {
    return devicesData;
  }

  basePlantData(zoom: number, centerX: number, centerY: number): FeatureCollection {
    return basePlantData();
  }

  basePlantDataImg$(zoom: number, centerX: number, centerY: number): Observable<any> {
    return this.httpClient.get(`/api/plant?centerX=${centerX}&centerY=${centerY}$zoom=${zoom}`)
  }

}
