import { TestBed } from '@angular/core/testing';

import { DataFlatService } from './data-flat.service';

describe('DataFlatService', () => {
  let service: DataFlatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataFlatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
