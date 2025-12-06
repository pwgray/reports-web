# Reports Web Application

A modern, feature-rich web application built with Angular 19 for creating, managing, and viewing database reports. This application provides a visual, no-code interface for building complex reports from multiple database sources without writing SQL.

## Table of Contents

- [Purpose](#purpose)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [API Integration](#api-integration)
- [Troubleshooting](#troubleshooting)

## Purpose

The Reports Web Application enables users to:

- **Connect to multiple database types** (SQL Server, MySQL, PostgreSQL, Oracle) without writing connection strings
- **Build reports visually** using an intuitive drag-and-drop interface - no SQL knowledge required
- **Create complex queries** with field selection, filtering, grouping, sorting, and aggregations
- **Preview reports in real-time** before saving to ensure data accuracy
- **Export reports to Excel** for further analysis and sharing
- **Manage report templates** for quick report creation
- **View and interact with reports** with dynamic filtering and formatting options

This application serves as the frontend companion to the [Reports API](../reports-api/README.md), providing a complete solution for enterprise report management.

## Features

### 🔌 Data Source Management
- Connect to SQL Server, PostgreSQL, MySQL, and Oracle databases
- Create and manage multiple data source connections
- Automatic database schema introspection
- Schema filtering and object type selection
- Secure credential storage

### 📊 Visual Report Builder
- **5-Step Wizard Interface:**
  1. **Data Source Selection** - Choose or create a database connection
  2. **Field Selection** - Select fields from tables with hierarchical view
  3. **Filter Builder** - Add complex filter conditions (equals, contains, between, etc.)
  4. **Group & Sort** - Configure data grouping and sorting
  5. **Format & Preview** - Set layout, formatting, and preview results

- **Advanced Features:**
  - Drag-and-drop field selection
  - Related table field selection
  - Field aggregation (Sum, Average, Count, Min, Max)
  - Complex filter logic with multiple conditions
  - Multiple grouping levels
  - Multi-field sorting
  - Field formatting (currency, dates, numbers)

### 📈 Report Visualization
- Table view with virtual scrolling for large datasets
- Chart previews (bar, line, pie, area, column)
- Widget previews (metrics, KPIs, trends)
- Real-time data preview updates
- Responsive layout preview

### 📋 Report Management
- List all saved reports with search and sort
- Report templates for quick creation
- View, edit, and delete reports
- Dynamic filter modification at runtime
- Report metadata display (grouping, aggregations, sorting)

### 📥 Export Capabilities
- Export reports to Excel (.xlsx) format
- Client-side Excel generation using `xlsx` library
- Formatted data export with proper types

## Technology Stack

- **Framework:** Angular 19 (Standalone Components)
- **Language:** TypeScript 5.7
- **UI Framework:** Angular Material 19
- **Icons:** FontAwesome 5
- **HTTP Client:** Angular HttpClient (RxJS Observables)
- **Excel Export:** xlsx 0.18.5
- **State Management:** RxJS (BehaviorSubject, Observable)
- **Routing:** Angular Router
- **Build Tool:** Angular CLI
- **Testing:** Jasmine + Karma

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (v9.x or higher) - Comes with Node.js
- **Angular CLI** (v19.x or higher) - Install globally: `npm install -g @angular/cli`
- **Reports API** - The backend API must be running (see [Reports API README](../reports-api/README.md))

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd reports-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create or update the environment configuration file:

**`src/environments/environment.ts`** (for development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'  // Your Reports API URL
};
```

**`src/environments/environment.prod.ts`** (for production):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api'  // Production API URL
};
```

### 4. Start Development Server

```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200/`

### 5. Verify Setup

1. Open `http://localhost:4200/` in your browser
2. Ensure the Reports API is running and accessible
3. Try creating a new report to verify API connectivity

## Configuration

### API Configuration

The application communicates with the Reports API. Configure the API URL in the environment files:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'  // Update to match your API
};
```

### CORS Configuration

If you encounter CORS errors, ensure the Reports API has CORS enabled for your development domain (`http://localhost:4200`).

### Database Connection Types

Supported database types:
- `sqlserver` - Microsoft SQL Server
- `postgresql` - PostgreSQL
- `mysql` - MySQL
- `oracle` - Oracle Database

## Usage

### Creating a New Report

1. **Navigate to Reports List**
   - Click "New Report" or go to `/builder`

2. **Step 1: Choose Data Source**
   - Select an existing data source or create a new one
   - For new data sources:
     - Enter database connection details (server, port, database, credentials)
     - Click "Fetch Schema" to introspect the database
     - Click "Save" to store the connection

3. **Step 2: Select Fields**
   - Browse the schema in hierarchical or flat view
   - Click fields to add them to the report
   - Configure aggregations for numeric fields (Sum, Avg, Count, etc.)
   - Select fields from related tables using the relationship dialog
   - Configure field formatting (currency, dates, etc.)

4. **Step 3: Add Filters**
   - Click "Add Filter" to create filter conditions
   - Select field, operator (equals, contains, between, etc.), and value
   - Add multiple filters and combine with AND/OR logic
   - Filters are validated based on field data types

5. **Step 4: Group & Sort**
   - Add fields for grouping (creates grouped rows)
   - Add sort fields with direction (ascending/descending)
   - Multiple sort levels are supported

6. **Step 5: Format & Preview**
   - Enter report name and description
   - Configure layout settings (table, chart, widgets)
   - Preview the report data in real-time
   - Click "Save Report" to persist the configuration

### Viewing Reports

1. **From Reports List**
   - Click on a report card to view it
   - Or click the "View" icon

2. **In Report Viewer**
   - See report data in table format
   - Modify filters dynamically
   - View report metadata (grouping, aggregations)
   - Export to Excel
   - Edit the report

### Editing Reports

1. From Reports List or Report Viewer, click "Edit"
2. The report builder opens with existing configuration
3. Modify any step of the report
4. Save changes

### Exporting Reports

1. In Report Viewer, click "Export to Excel"
2. The report data is generated client-side
3. Excel file downloads automatically

### Example: Creating a Sales Report

```typescript
// 1. Create Data Source
{
  name: "Sales Database",
  type: "sqlserver",
  server: "sales-db.company.com",
  database: "SalesDB",
  username: "report_user",
  password: "***"
}

// 2. Select Fields
- Orders.OrderDate
- Orders.TotalAmount (with SUM aggregation)
- Customers.CustomerName
- Products.ProductName

// 3. Add Filters
- OrderDate >= '2024-01-01'
- TotalAmount > 1000

// 4. Group & Sort
- Group by: Customers.CustomerName, Products.ProductName
- Sort by: Orders.OrderDate (descending)

// 5. Save as "Q1 2024 Sales Report"
```

## Architecture

### Component Architecture

The application follows Angular's component-based architecture with a feature-based folder structure:

```
app/
├── core/              # Shared core functionality
│   ├── models/       # TypeScript interfaces and types
│   └── utils/        # Utility functions and validators
├── features/         # Feature modules
│   ├── report-builder/    # Report creation wizard
│   ├── report-viewer/     # Report viewing and interaction
│   └── reports-list/      # Reports listing and management
├── layout/           # Layout components
└── shared/           # Shared reusable components
```

### Data Flow

1. **Service Layer** (`ReportBuilderService`)
   - Handles all HTTP communication with the API
   - Manages application state using RxJS Observables
   - Provides methods for CRUD operations

2. **Component Layer**
   - Presentation and user interaction
   - Delegates data operations to services
   - Manages local component state

3. **Model Layer**
   - TypeScript interfaces define data structures
   - Models ensure type safety across the application

### State Management

- **RxJS Observables** for reactive data flow
- **BehaviorSubject** for current report state
- **Component-level state** for UI interactions
- **Service-level state** for shared data

## Project Structure

```
reports-web/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/              # Type definitions
│   │   │   │   ├── data-source-info.model.ts
│   │   │   │   ├── preview-result.model.ts
│   │   │   │   ├── report.models.ts
│   │   │   │   └── schema-info.model.ts
│   │   │   └── utils/               # Utility functions
│   │   │       ├── model-validators.ts
│   │   │       ├── model-transforms.ts
│   │   │       └── index.ts
│   │   ├── features/
│   │   │   ├── report-builder/      # Report creation wizard
│   │   │   │   ├── components/
│   │   │   │   │   ├── chart-preview/
│   │   │   │   │   ├── datasource-selector/
│   │   │   │   │   ├── field-format-dialog/
│   │   │   │   │   ├── field-selector/
│   │   │   │   │   ├── filter-builder/
│   │   │   │   │   ├── group-sorting/
│   │   │   │   │   ├── preview-panel/
│   │   │   │   │   ├── related-field-dialog/
│   │   │   │   │   └── widget-preview/
│   │   │   │   ├── report-builder.component.ts
│   │   │   │   └── services/
│   │   │   │       └── report-builder.service.ts
│   │   │   ├── report-viewer/       # Report viewing
│   │   │   │   └── report-viewer.component.ts
│   │   │   └── reports-list/        # Reports listing
│   │   │       └── reports-list.component.ts
│   │   ├── layout/                  # Layout components
│   │   │   ├── layout-preview/
│   │   │   └── layout-settings-dialog/
│   │   ├── shared/                  # Shared components
│   │   │   └── components/
│   │   │       ├── help-tooltip/
│   │   │       └── smart-search/
│   │   ├── app.component.ts         # Root component
│   │   ├── app.routes.ts            # Route configuration
│   │   └── app.config.ts            # App configuration
│   ├── environments/
│   │   ├── environment.ts           # Development config
│   │   └── environment.prod.ts      # Production config
│   └── assets/                      # Static assets
├── angular.json                     # Angular CLI configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

## Development

### Running the Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any source files.

### Building for Production

```bash
npm run build
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

### Code Generation

Generate new components, services, and more using Angular CLI:

```bash
# Generate a new component
ng generate component component-name

# Generate a new service
ng generate service service-name

# Generate with options
ng generate component feature/component-name --skip-tests
```

### Code Style

The project follows Angular style guide best practices:
- Standalone components
- OnPush change detection where applicable
- RxJS operators for reactive programming
- TypeScript strict mode
- Comprehensive JSDoc documentation

## Testing

### Running Unit Tests

```bash
npm test
# or
ng test
```

This will execute unit tests via [Karma](https://karma-runner.github.io) and watch for file changes.

### Running Tests with Coverage

```bash
ng test --code-coverage
```

Coverage reports will be generated in the `coverage/` directory.

### Test Structure

- Unit tests use Jasmine and Karma
- Tests are co-located with source files (`.spec.ts`)
- Core utilities have comprehensive test coverage (80%+)

### Example Test

```typescript
describe('ReportBuilderService', () => {
  let service: ReportBuilderService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportBuilderService);
  });

  it('should retrieve reports', () => {
    service.getReports().subscribe(reports => {
      expect(reports).toBeDefined();
    });
  });
});
```

## API Integration

### Service Methods

The `ReportBuilderService` provides methods for all API interactions:

```typescript
// Reports
getReports(): Observable<ReportDefinition[]>
getReport(id: string): Observable<ReportDefinition>
saveReport(report: ReportDefinition): Observable<ReportDefinition>
deleteReport(id: string): Observable<void>

// Data Sources
getDataSources(): Observable<DataSourceInfo[]>
createDataSource(dataSource: DataSourceInfo): Observable<DataSourceInfo>
updateDataSource(id: string, dataSource: DataSourceInfo): Observable<DataSourceInfo>
deleteDataSource(id: string): Observable<void>

// Schema
getSchema(dataSourceId: string): Observable<SchemaInfo>
introspectSchema(dataSource: DataSourceInfo): Observable<SchemaInfo>

// Preview
previewReport(report: ReportDefinition): Observable<PreviewResult>
exportToExcel(report: ReportDefinition): Observable<Blob>
```

### Example Usage

```typescript
import { ReportBuilderService } from './services/report-builder.service';

constructor(private reportService: ReportBuilderService) {}

// Load all reports
this.reportService.getReports().subscribe({
  next: (reports) => {
    this.reports = reports;
  },
  error: (error) => {
    console.error('Failed to load reports:', error);
  }
});

// Create a data source
const newDataSource: DataSourceInfo = {
  name: 'My Database',
  type: 'sqlserver',
  server: 'localhost',
  database: 'MyDB',
  username: 'user',
  password: 'pass'
};

this.reportService.createDataSource(newDataSource).subscribe({
  next: (dataSource) => {
    console.log('Data source created:', dataSource.id);
  }
});
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem:** Browser blocks API requests with CORS errors.

**Solution:**
- Ensure Reports API has CORS enabled for `http://localhost:4200`
- Check API configuration in Reports API project

#### 2. API Connection Failed

**Problem:** Cannot connect to the Reports API.

**Solution:**
- Verify `apiUrl` in `environment.ts` matches your API server
- Ensure Reports API is running
- Check network connectivity
- Verify firewall settings

#### 3. Database Schema Not Loading

**Problem:** Schema introspection fails or takes too long.

**Solution:**
- Verify database connection credentials
- Check database server accessibility
- Ensure database user has schema read permissions
- Try reducing schema filtering (use `includedSchemas` to limit scope)

#### 4. Build Errors

**Problem:** TypeScript compilation errors.

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
ng cache clean
```

#### 5. Port Already in Use

**Problem:** `ng serve` fails with port 4200 already in use.

**Solution:**
```bash
# Use a different port
ng serve --port 4201

# Or kill the process using port 4200
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4200 | xargs kill
```

### Debugging Tips

1. **Browser DevTools**
   - Check Network tab for API request failures
   - Use Console for error messages
   - Inspect Angular component state in Elements tab

2. **Angular DevTools**
   - Install Angular DevTools browser extension
   - Inspect component tree and state

3. **API Logs**
   - Check Reports API server logs
   - Verify API endpoints are responding

## Additional Resources

- [Angular Documentation](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Reports API Documentation](../reports-api/README.md)

## License

UNLICENSED
