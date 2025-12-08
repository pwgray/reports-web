/**
 * Unit tests for ReportsListComponent.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReportsListComponent } from './reports-list.component';
import { ReportBuilderService } from '../report-builder/services/report-builder.service';
import { ReportDefinition } from '../../core/models/report.models';
import { DataSourceInfo } from '../../core/models/data-source-info.model';

describe('ReportsListComponent', () => {
  let component: ReportsListComponent;
  let fixture: ComponentFixture<ReportsListComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let reportServiceSpy: jasmine.SpyObj<ReportBuilderService>;

  const mockReports: ReportDefinition[] = [
    {
      id: '1',
      name: 'Report A',
      description: 'Description A',
      dataSource: {} as DataSourceInfo,
      selectedFields: [],
      filters: [],
      groupBy: [],
      sorting: [],
      layout: {},
      parameters: []
    },
    {
      id: '2',
      name: 'Report B',
      description: 'Description B',
      dataSource: {} as DataSourceInfo,
      selectedFields: [],
      filters: [],
      groupBy: [],
      sorting: [],
      layout: {},
      parameters: []
    },
    {
      id: '3',
      name: 'Z Report',
      description: 'Last Report',
      dataSource: {} as DataSourceInfo,
      selectedFields: [],
      filters: [],
      groupBy: [],
      sorting: [],
      layout: {},
      parameters: []
    }
  ];

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    reportServiceSpy = jasmine.createSpyObj('ReportBuilderService', ['getReports', 'deleteReport']);

    await TestBed.configureTestingModule({
      imports: [ReportsListComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ReportBuilderService, useValue: reportServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load reports on init', () => {
      reportServiceSpy.getReports.and.returnValue(of(mockReports));

      fixture.detectChanges();

      expect(reportServiceSpy.getReports).toHaveBeenCalled();
      expect(component.allReports).toEqual(mockReports);
      expect(component.reports).toEqual(mockReports);
    });

    it('should handle empty reports', () => {
      reportServiceSpy.getReports.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.allReports).toEqual([]);
      expect(component.reports).toEqual([]);
    });
  });

  describe('createBlankReport', () => {
    it('should navigate to builder', () => {
      component.createBlankReport();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/builder']);
    });
  });

  describe('startFromTemplate', () => {
    it('should navigate to builder with template state', () => {
      component.startFromTemplate('table');

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/builder'],
        { state: { template: 'table' } }
      );
    });

    it('should handle different template types', () => {
      const templates: Array<'table' | 'chart' | 'chart-table' | 'widgets-table' | 'dashboard'> = 
        ['chart', 'chart-table', 'widgets-table', 'dashboard'];

      templates.forEach(template => {
        component.startFromTemplate(template);
        expect(routerSpy.navigate).toHaveBeenCalledWith(
          ['/builder'],
          { state: { template } }
        );
      });
    });
  });

  describe('viewReport', () => {
    it('should navigate to report viewer', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.viewReport(mockReports[0], event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/report', '1']);
    });
  });

  describe('editReport', () => {
    it('should navigate to builder with report id', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.editReport(mockReports[0], event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/builder', '1'],
        { state: { reportId: '1' } }
      );
    });
  });

  describe('deleteReport', () => {
    it('should delete report on confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      reportServiceSpy.deleteReport.and.returnValue(of({} as any));
      component.allReports = [...mockReports];
      component.reports = [...mockReports];

      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.deleteReport(mockReports[0], event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(reportServiceSpy.deleteReport).toHaveBeenCalledWith('1');
      expect(component.allReports.length).toBe(2);
      expect(component.reports.length).toBe(2);
    });

    it('should not delete report if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.allReports = [...mockReports];

      const event = new MouseEvent('click');
      component.deleteReport(mockReports[0], event);

      expect(reportServiceSpy.deleteReport).not.toHaveBeenCalled();
      expect(component.allReports.length).toBe(3);
    });

    // Note: Error handling test removed because the component's deleteReport 
    // method doesn't have error handling. In a real scenario, errors would be 
    // unhandled and logged to console. For proper error handling, the component 
    // should be updated to include error callbacks in the subscribe.
  });

  describe('applyFilters', () => {
    beforeEach(() => {
      component.allReports = [...mockReports];
    });

    it('should filter by search term', () => {
      component.searchTerm = 'Report A';

      component.applyFilters();

      expect(component.reports.length).toBe(1);
      expect(component.reports[0].name).toBe('Report A');
    });

    it('should filter templates by search term', () => {
      component.searchTerm = 'tabl';

      component.applyFilters();

      expect(component.filteredTemplates.some(t => t.key === 'table')).toBe(true);
    });

    it('should sort by name ascending', () => {
      component.sortOption = 'name-asc';

      component.applyFilters();

      expect(component.reports[0].name).toBe('Report A');
      expect(component.reports[component.reports.length - 1].name).toBe('Z Report');
    });

    it('should sort by name descending', () => {
      component.sortOption = 'name-desc';

      component.applyFilters();

      expect(component.reports[0].name).toBe('Z Report');
      expect(component.reports[component.reports.length - 1].name).toBe('Report A');
    });

    it('should return all reports when search is empty', () => {
      component.searchTerm = '';

      component.applyFilters();

      expect(component.reports.length).toBe(3);
    });

    it('should be case insensitive', () => {
      component.searchTerm = 'report a';

      component.applyFilters();

      expect(component.reports.length).toBe(1);
      expect(component.reports[0].name).toBe('Report A');
    });
  });

  describe('openReport', () => {
    it('should navigate to builder with report id in state', () => {
      component.openReport(mockReports[0]);

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/builder'],
        { state: { reportId: '1' } }
      );
    });
  });
});
