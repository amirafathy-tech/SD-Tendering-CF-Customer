import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudDataComponent } from './cloud-data.component';

describe('CloudDataComponent', () => {
  let component: CloudDataComponent;
  let fixture: ComponentFixture<CloudDataComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CloudDataComponent]
    });
    fixture = TestBed.createComponent(CloudDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
