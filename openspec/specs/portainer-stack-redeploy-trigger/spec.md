# Portainer Stack Redeploy Trigger Specification

## Purpose
Define the deployment-time Portainer API trigger contract to recreate frontend stack `3` after successful image publication.

## Requirements

### Requirement: Deployment MUST trigger Portainer stack redeploy after image push
After successfully pushing `cristiangimenez86/cv-web:latest`, the system MUST call the Portainer API to recreate stack ID `3` using `/api/stacks/3/recreate` or an equivalent supported endpoint.

#### Scenario: Redeploy is requested after successful publish
- **WHEN** Docker Hub image push succeeds
- **THEN** the workflow sends an authenticated Portainer API request targeting stack `3` recreation

### Requirement: Portainer API call MUST use repository-managed secrets
The redeploy request MUST use `PORTAINER_URL` and `PORTAINER_TOKEN` from GitHub secrets and MUST fail the workflow on non-success responses.

#### Scenario: Successful authenticated redeploy call
- **WHEN** valid Portainer URL and token are provided
- **THEN** stack recreation request returns success and workflow completes

#### Scenario: Invalid Portainer auth or endpoint
- **WHEN** `PORTAINER_URL` or `PORTAINER_TOKEN` is missing, invalid, or endpoint returns non-2xx
- **THEN** the workflow fails and records redeploy step error
