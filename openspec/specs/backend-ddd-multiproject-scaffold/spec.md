# backend-ddd-multiproject-scaffold Specification

## Purpose
TBD - created by archiving change backend-ddd-multiproject-scaffold. Update Purpose after archive.
## Requirements
### Requirement: Backend entry project SHALL be `CvIa.Api`
The backend solution MUST expose `CvIa.Api` as the HTTP entry point project and MUST not use `CvIa.Backend` as the runtime entry project after scaffold migration.

#### Scenario: Backend starts from renamed API project
- **WHEN** the developer runs the backend startup command from workspace scripts
- **THEN** the command targets `CvIa.Api` as the startup project
- **AND** the service boots with the same health route availability expectation

### Requirement: Backend scaffold MUST use DDD multi-project separation
The backend source MUST be organized into separate projects for API, Application, Domain, and Infrastructure concerns, with explicit project references that prevent API layer business logic concentration.

#### Scenario: Developer inspects backend solution structure
- **WHEN** the developer opens the backend solution
- **THEN** distinct projects exist for `CvIa.Api`, `CvIa.Application`, `CvIa.Domain`, and `CvIa.Infrastructure`
- **AND** `CvIa.Api` references Application and Infrastructure through defined composition boundaries

### Requirement: API endpoints MUST be defined via controller classes
The API scaffold MUST use controller-based endpoints (attribute-routed controllers) and MUST avoid minimal API handlers for `/api/v1/*` routes in this phase.

#### Scenario: Developer inspects API route definitions
- **WHEN** the developer reviews the route implementation for contract endpoints
- **THEN** routes are defined in controller classes under the API project
- **AND** endpoint methods are scaffold placeholders without embedded business implementation

### Requirement: Controllers SHALL depend on Application services only
Each controller MUST receive its operational dependency through constructor injection of an Application-layer service interface and MUST not contain domain logic or infrastructure orchestration.

#### Scenario: Controller class dependency inspection
- **WHEN** a controller constructor is reviewed
- **THEN** it includes at least one Application service interface dependency
- **AND** action methods delegate behavior to injected services or return explicit scaffold placeholders

### Requirement: API scaffold MUST provide global exception handling middleware
The API pipeline MUST include a custom global exception middleware that catches unhandled exceptions, logs through `ILogger`, and returns a consistent machine-readable error response.

#### Scenario: Unhandled exception occurs in request pipeline
- **WHEN** an unhandled exception is thrown during request processing
- **THEN** global middleware handles the exception without crashing the process
- **AND** the client receives a normalized error payload with an error HTTP status code

### Requirement: Logging integration MUST use `ILogger` abstractions
API-level components in this scaffold MUST consume logging through injected `ILogger<T>` abstractions and MUST not require a specific telemetry stack or logging provider configuration.

#### Scenario: API component emits operational logs
- **WHEN** a controller or middleware requires logging
- **THEN** it uses an injected `ILogger<T>` instance
- **AND** the scaffold remains functional without adding telemetry packages

### Requirement: Scaffold controllers MUST have no security requirements
Controller endpoints introduced in this scaffold MUST not enforce authentication or authorization policies until a dedicated security change is defined.

#### Scenario: Client calls scaffold API endpoint without credentials
- **WHEN** a request reaches a scaffolded controller route
- **THEN** the request is not blocked by auth middleware or policy attributes
- **AND** route behavior is governed only by scaffold routing and placeholder flow

### Requirement: Backend tests MUST be consolidated in one project
The backend test suite MUST use a single test project, and within that project, test folders MUST mirror the production project names to preserve architectural readability.

#### Scenario: Developer inspects test project organization
- **WHEN** the developer opens the test project directory
- **THEN** one backend test project exists
- **AND** it contains folder groups corresponding to Api, Application, Domain, and Infrastructure

