/**
 * Unit tests for ReportBuilderComponent.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ReportBuilderComponent } from './report-builder.component';
import { ReportBuilderService } from './services/report-builder.service';
import { ReportDefinition, LayoutConfiguration } from '../../core/models/report.models';
import { DataSourceInfo } from '../../core/models/data-source-info.model';
import { SchemaInfo } from '../../core/models/schema-info.model';

describe('ReportBuilderComponent', () => {
  let component: ReportBuilderComponent;
  let fixture: ComponentFixture<ReportBuilderComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let routeSpy: any;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let reportServiceSpy: jasmine.SpyObj<ReportBuilderService>;

  const mockDataSource: DataSourceInfo = {
    id: '1',
    name: 'Test DB',
    type: 'sqlserver',
    server: 'localhost',
    database: 'testdb',
    username: 'user',
    password: 'pass'
  };

  const mockSchema: SchemaInfo = {
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', dataType: 'int' },
          { name: 'name', dataType: 'varchar' }
        ]
      }
    ]
  };

  const mockReport: ReportDefinition = {
    id: '1',
    name: 'Test Report',
    dataSource: mockDataSource,
    selectedFields: [],
    filters: [],
    groupBy: [],
    sorting: [],
    layout: {},
    parameters: []
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl', 'getCurrentNavigation']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    reportServiceSpy = jasmine.createSpyObj('ReportBuilderService', [
      'getDataSources',
      'getReport',
      'saveReport',
      'getSchema',
      'updateCurrentReport'
    ]);

    const paramMap = new BehaviorSubject({
      get: (key: string) => null
    } as any);

    routeSpy = {
      snapshot: {
        paramMap: {
          get: (key: string) => null
        }
      },
      paramMap
    };

    routerSpy.getCurrentNavigation.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ReportBuilderComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ReportBuilderService, useValue: reportServiceSpy }
      ]
    })
      .overrideComponent(ReportBuilderComponent, {
        remove: {
          imports: []
        },
        add: {
          imports: []
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReportBuilderComponent);
    component = fixture.componentInstance;

    reportServiceSpy.getDataSources.and.returnValue(of([mockDataSource]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize data sources', () => {
      fixture.detectChanges();

      expect(reportServiceSpy.getDataSources).toHaveBeenCalled();
    });

    it('should load report from route param', () => {
      routeSpy.snapshot.paramMap.get = (key: string) => key === 'id' ? '1' : null;
      reportServiceSpy.getReport.and.returnValue(of(mockReport));
      reportServiceSpy.getSchema.and.returnValue(of(mockSchema));

      fixture.detectChanges();

      expect(reportServiceSpy.getReport).toHaveBeenCalledWith('1');
    });

    it('should load report from navigation state', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        id: 1,
        initialUrl: {} as any,
        extractedUrl: {} as any,
        trigger: 'imperative',
        previousNavigation: null,
        extras: { state: { reportId: '1' } }
      } as any);
      reportServiceSpy.getReport.and.returnValue(of(mockReport));
      reportServiceSpy.getSchema.and.returnValue(of(mockSchema));

      fixture.detectChanges();

      expect(reportServiceSpy.getReport).toHaveBeenCalledWith('1');
    });

    it('should apply template from navigation state', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        id: 1,
        initialUrl: {} as any,
        extractedUrl: {} as any,
        trigger: 'imperative',
        previousNavigation: null,
        extras: { state: { template: 'table' } }
      } as any);

      fixture.detectChanges();

      expect(component.report).toBeDefined();
    });
  });

  describe('saveReport', () => {
    it('should save report successfully', () => {
      component.report = mockReport;
      reportServiceSpy.saveReport.and.returnValue(of(mockReport));

      component.saveReport();

      expect(reportServiceSpy.saveReport).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Report saved', 'Close', { duration: 3000 });
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should handle save error', () => {
      component.report = mockReport;
      reportServiceSpy.saveReport.and.returnValue(throwError(() => new Error('Save failed')));

      component.saveReport();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to save report', 'Close', { duration: 3000 });
    });
  });

  describe('canProceed', () => {
    it('should return false for step 1 without data source', () => {
      component.currentStep = 1;
      component.report.dataSource = null as any;

      expect(component.canProceed()).toBe(false);
    });

    it('should return true for step 1 with data source', () => {
      component.currentStep = 1;
      component.report.dataSource = mockDataSource;

      expect(component.canProceed()).toBe(true);
    });

    it('should return false for step 2 without fields', () => {
      component.currentStep = 2;
      component.report.selectedFields = [];

      expect(component.canProceed()).toBe(false);
    });

    it('should return true for step 2 with fields', () => {
      component.currentStep = 2;
      component.report.selectedFields = [{ id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: 'string' as any }];

      expect(component.canProceed()).toBe(true);
    });

    it('should return true for optional steps 3 and 4', () => {
      component.currentStep = 3;
      expect(component.canProceed()).toBe(true);

      component.currentStep = 4;
      expect(component.canProceed()).toBe(true);
    });
  });

  describe('nextStep', () => {
    it('should advance to next step when can proceed', () => {
      component.currentStep = 1;
      component.report.dataSource = mockDataSource;

      component.nextStep();

      expect(component.currentStep).toBe(2);
    });

    it('should not advance if cannot proceed', () => {
      component.currentStep = 1;
      component.report.dataSource = null as any;

      component.nextStep();

      expect(component.currentStep).toBe(1);
    });

    it('should not advance beyond step 5', () => {
      component.currentStep = 5;

      component.nextStep();

      expect(component.currentStep).toBe(5);
    });
  });

  describe('previousStep', () => {
    it('should go to previous step', () => {
      component.currentStep = 3;

      component.previousStep();

      expect(component.currentStep).toBe(2);
    });

    it('should not go below step 1', () => {
      component.currentStep = 1;

      component.previousStep();

      expect(component.currentStep).toBe(1);
    });
  });

  describe('onDataSourceSelected', () => {
    it('should set data source and load schema', () => {
      reportServiceSpy.getSchema.and.returnValue(of(mockSchema));

      component.onDataSourceSelected(mockDataSource);

      expect(component.report.dataSource).toBe(mockDataSource);
      expect(reportServiceSpy.getSchema).toHaveBeenCalledWith('1');
    });

    it('should not load schema if no id', () => {
      const dsWithoutId = { ...mockDataSource, id: undefined };

      component.onDataSourceSelected(dsWithoutId);

      expect(reportServiceSpy.getSchema).not.toHaveBeenCalled();
    });
  });

  describe('onFieldsChanged', () => {
    it('should update selected fields', () => {
      const fields = [{ id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: 'string' as any }];

      component.onFieldsChanged(fields);

      expect(component.report.selectedFields).toBe(fields);
      expect(reportServiceSpy.updateCurrentReport).toHaveBeenCalled();
    });
  });

  describe('onFiltersChanged', () => {
    it('should update filters', () => {
      const filters: any[] = [];

      component.onFiltersChanged(filters);

      expect(component.report.filters).toBe(filters);
      expect(reportServiceSpy.updateCurrentReport).toHaveBeenCalled();
    });
  });

  describe('onGroupingChanged', () => {
    it('should update grouping', () => {
      const grouping: any[] = [];

      component.onGroupingChanged(grouping);

      expect(component.report.groupBy).toBe(grouping);
      expect(snackBarSpy.open).toHaveBeenCalled();
    });
  });

  describe('onSortingChanged', () => {
    it('should update sorting', () => {
      const sorting: any[] = [];

      component.onSortingChanged(sorting);

      expect(component.report.sorting).toBe(sorting);
      expect(reportServiceSpy.updateCurrentReport).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Sorting updated', 'Close', { duration: 3000 });
    });
  });

  describe('onLayoutChanged', () => {
    it('should update layout', () => {
      const layout: LayoutConfiguration = {
        orientation: 'portrait',
        pageSize: 'A4',
        showHeader: true,
        showFooter: true
      };

      component.onLayoutChanged(layout);

      expect(component.report.layout).toBe(layout);
      expect(snackBarSpy.open).toHaveBeenCalled();
    });
  });

  describe('onDataSourceCreated', () => {
    it('should refresh data sources and select new one', () => {
      reportServiceSpy.getSchema.and.returnValue(of(mockSchema));

      component.onDataSourceCreated(mockDataSource);

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(reportServiceSpy.getDataSources).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
