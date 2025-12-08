/**
 * Unit tests for ReportViewerComponent.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ReportViewerComponent } from './report-viewer.component';
import { ReportBuilderService } from '../report-builder/services/report-builder.service';
import { ReportDefinition } from '../../core/models/report.models';
import { DataSourceInfo } from '../../core/models/data-source-info.model';

describe('ReportViewerComponent', () => {
  let component: ReportViewerComponent;
  let fixture: ComponentFixture<ReportViewerComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let routeSpy: any;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let reportServiceSpy: jasmine.SpyObj<ReportBuilderService>;

  const mockReport: ReportDefinition = {
    id: '1',
    name: 'Test Report',
    description: 'Test Description',
    dataSource: {} as DataSourceInfo,
    selectedFields: [],
    filters: [],
    groupBy: [],
    sorting: [],
    layout: {},
    parameters: []
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    reportServiceSpy = jasmine.createSpyObj('ReportBuilderService', [
      'getReport',
      'updateCurrentReport'
    ]);

    const paramMap = new BehaviorSubject({
      get: (key: string) => key === 'id' ? '1' : null
    } as any);

    routeSpy = {
      paramMap
    };

    await TestBed.configureTestingModule({
      imports: [ReportViewerComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ReportBuilderService, useValue: reportServiceSpy }
      ]
    })
      .overrideComponent(ReportViewerComponent, {
        remove: {
          imports: []
        },
        add: {
          imports: []
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReportViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load report from route params', () => {
      reportServiceSpy.getReport.and.returnValue(of(mockReport));

      fixture.detectChanges();

      expect(reportServiceSpy.getReport).toHaveBeenCalledWith('1');
      expect(component.report).toEqual(mockReport);
      expect(component.isLoading).toBe(false);
    });

    it('should handle missing report id', () => {
      routeSpy.paramMap.next({
        get: (key: string) => null
      });

      fixture.detectChanges();

      expect(component.error).toBe('No report ID provided');
    });

    it('should handle load error', () => {
      reportServiceSpy.getReport.and.returnValue(throwError(() => new Error('Load failed')));

      fixture.detectChanges();

      expect(component.error).toBe('Failed to load report');
      expect(component.isLoading).toBe(false);
    });

    it('should initialize filters from report', () => {
      const reportWithFilters = {
        ...mockReport,
        filters: [{ id: 'f1', field: {} as any, operator: 'equals' as any, value: 'test', displayText: 'test' }]
      };
      reportServiceSpy.getReport.and.returnValue(of(reportWithFilters));

      fixture.detectChanges();

      expect(component.currentFilters.length).toBe(1);
    });
  });

  describe('toggleFilters', () => {
    it('should toggle filter visibility', () => {
      component.showFilters = false;

      component.toggleFilters();

      expect(component.showFilters).toBe(true);

      component.toggleFilters();

      expect(component.showFilters).toBe(false);
    });
  });

  describe('toggleMetadata', () => {
    it('should toggle metadata visibility', () => {
      component.showMetadata = false;

      component.toggleMetadata();

      expect(component.showMetadata).toBe(true);

      component.toggleMetadata();

      expect(component.showMetadata).toBe(false);
    });
  });

  describe('onFiltersChanged', () => {
    it('should update current filters', () => {
      const filters: any[] = [{ id: 'f1' }];

      component.onFiltersChanged(filters);

      expect(component.currentFilters).toBe(filters);
    });
  });

  describe('applyFilters', () => {
    it('should apply filters to report', () => {
      component.report = mockReport;
      component.currentFilters = [{ id: 'f1', field: {} as any, operator: 'equals' as any, value: 'test', displayText: 'test' }];

      component.applyFilters();

      expect(component.report?.filters).toBe(component.currentFilters);
      expect(reportServiceSpy.updateCurrentReport).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalled();
    });
  });

  describe('editReport', () => {
    it('should navigate to builder with report id', () => {
      component.report = mockReport;

      component.editReport();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/builder', '1']);
    });
  });

  describe('goBack', () => {
    it('should navigate to reports list', () => {
      component.goBack();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/reports']);
    });
  });

  describe('hasGrouping', () => {
    it('should return true when report has grouping', () => {
      component.report = {
        ...mockReport,
        groupBy: [{ id: 'g1', tableName: 'users', fieldName: 'category', displayName: 'Category' }]
      };

      expect(component.hasGrouping()).toBe(true);
    });

    it('should return false when no grouping', () => {
      component.report = mockReport;

      expect(component.hasGrouping()).toBe(false);
    });
  });

  describe('hasAggregations', () => {
    it('should return true when report has aggregations', () => {
      component.report = {
        ...mockReport,
        selectedFields: [{ 
          id: 'f1', 
          tableName: 'users', 
          fieldName: 'amount', 
          displayName: 'Amount', 
          dataType: 'number' as any,
          aggregation: 'sum' as any
        }]
      };

      expect(component.hasAggregations()).toBe(true);
    });

    it('should return false when no aggregations', () => {
      component.report = mockReport;

      expect(component.hasAggregations()).toBe(false);
    });
  });

  describe('hasSorting', () => {
    it('should return true when report has sorting', () => {
      component.report = {
        ...mockReport,
        sorting: [{ id: 's1', tableName: 'users', fieldName: 'name', displayName: 'Name', direction: 'asc' }]
      };

      expect(component.hasSorting()).toBe(true);
    });

    it('should return false when no sorting', () => {
      component.report = mockReport;

      expect(component.hasSorting()).toBe(false);
    });
  });

  describe('getAggregatedFields', () => {
    it('should return fields with aggregations', () => {
      const aggregatedField = { 
        id: 'f1', 
        tableName: 'users', 
        fieldName: 'amount', 
        displayName: 'Amount', 
        dataType: 'number' as any,
        aggregation: 'sum' as any
      };
      component.report = {
        ...mockReport,
        selectedFields: [
          aggregatedField,
          { id: 'f2', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: 'string' as any }
        ]
      };

      const aggregated = component.getAggregatedFields();

      expect(aggregated.length).toBe(1);
      expect(aggregated[0]).toBe(aggregatedField);
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
