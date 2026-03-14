# Frontend Mainline Auto Deploy Specification

## Purpose
Define the frontend deployment automation behavior so deployment runs only from `main` pushes and executes in a fail-fast sequence.

## Requirements

### Requirement: Frontend deployment MUST run only on pushes to main
The system MUST run automated frontend deployment only when commits are pushed to `main`, and MUST NOT deploy on pull request events.

#### Scenario: Push to main triggers deployment
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the frontend deployment workflow executes build, publish, and redeploy stages

#### Scenario: Pull request does not deploy
- **WHEN** a pull request is opened, synchronized, or reopened
- **THEN** no frontend deployment workflow is executed

### Requirement: Deployment pipeline MUST be ordered and fail-fast
The deployment workflow MUST enforce stage ordering and MUST stop before Portainer redeploy if image build or image push fails.

#### Scenario: Build failure blocks publish and redeploy
- **WHEN** Docker image build fails
- **THEN** the workflow fails and does not attempt Docker Hub push or Portainer API redeploy

#### Scenario: Push failure blocks redeploy
- **WHEN** Docker Hub push fails after a successful build
- **THEN** the workflow fails and does not call Portainer stack recreation
