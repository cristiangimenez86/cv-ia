## ADDED Requirements

### Requirement: Frontend image MUST build from frontend Dockerfile with repository-root context
The deployment pipeline MUST build the frontend container using `frontend/Dockerfile` while using repository root as Docker build context so `/content` is available to the build.

#### Scenario: Build command uses required file and context
- **WHEN** the deployment workflow executes the Docker build stage
- **THEN** it references `frontend/Dockerfile` as the Dockerfile path
- **AND** it uses repository root as the build context

### Requirement: Frontend image MUST be published to required Docker Hub tag
The deployment pipeline MUST publish the built image to Docker Hub as `cristiangimenez86/cv-web:latest` using authenticated credentials from repository secrets.

#### Scenario: Successful image publish
- **WHEN** Docker Hub authentication succeeds and build completes
- **THEN** the workflow pushes `cristiangimenez86/cv-web:latest`

#### Scenario: Missing Docker credentials fails deployment
- **WHEN** `DOCKERHUB_USERNAME` or `DOCKERHUB_TOKEN` is unavailable or invalid
- **THEN** the workflow fails before image push is completed
