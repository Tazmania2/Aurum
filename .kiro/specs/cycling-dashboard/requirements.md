# Requirements Document

## Introduction

This document specifies the requirements for a cycling dashboard web application that automatically rotates between four different views: a Business Intelligence (BI) report iframe and three different widget layout configurations. The system continuously cycles through these views at 10-second intervals without user intervention.

## Glossary

- **Dashboard Application**: The web application system that displays and cycles through views
- **BI View**: An embedded iframe displaying a Looker Studio report
- **Widget View**: A layout configuration displaying three Funifier widgets in specific arrangements
- **Funifier Widget**: An interactive gamification component rendered via the Funifier JavaScript SDK
- **View Cycle**: The automatic sequential transition from one view to the next at fixed intervals

## Requirements

### Requirement 1

**User Story:** As a dashboard viewer, I want the application to automatically cycle through all four views, so that I can see different data visualizations without manual interaction

#### Acceptance Criteria

1. THE Dashboard Application SHALL display View 1 (BI View) for exactly 10 seconds
2. WHEN 10 seconds elapse on View 1, THE Dashboard Application SHALL transition to View 2
3. WHEN 10 seconds elapse on View 2, THE Dashboard Application SHALL transition to View 3
4. WHEN 10 seconds elapse on View 3, THE Dashboard Application SHALL transition to View 4
5. WHEN 10 seconds elapse on View 4, THE Dashboard Application SHALL transition back to View 1

### Requirement 2

**User Story:** As a dashboard viewer, I want to see the Looker Studio BI report in View 1, so that I can monitor business intelligence metrics

#### Acceptance Criteria

1. THE Dashboard Application SHALL embed the Looker Studio report from URL "https://lookerstudio.google.com/embed/reporting/601fc253-c576-410f-b3fb-437d9f892ae3/page/8QlXF" in View 1
2. THE Dashboard Application SHALL display the BI report using an iframe element
3. THE Dashboard Application SHALL render the BI report at full viewport dimensions in View 1

### Requirement 3

**User Story:** As a dashboard viewer, I want to see Widget 1 (Vendedores) prominently in View 2, so that I can focus on sales team performance

#### Acceptance Criteria

1. THE Dashboard Application SHALL display Widget 1 (espacial) occupying 50% of the viewport height at the top of View 2
2. THE Dashboard Application SHALL display Widget 2 (corrida_espacial__referidos) occupying 25% of the viewport height in the bottom-left quadrant of View 2
3. THE Dashboard Application SHALL display Widget 3 (corrida_espacial__sdr) occupying 25% of the viewport height in the bottom-right quadrant of View 2
4. THE Dashboard Application SHALL initialize Widget 1 using the Funifier SDK with widget identifier "espacial"

### Requirement 4

**User Story:** As a dashboard viewer, I want to see Widget 2 (Referidos) prominently in View 3, so that I can focus on referral metrics

#### Acceptance Criteria

1. THE Dashboard Application SHALL display Widget 2 (corrida_espacial__referidos) occupying 50% of the viewport height at the top of View 3
2. THE Dashboard Application SHALL display Widget 1 (espacial) occupying 25% of the viewport height in the bottom-left quadrant of View 3
3. THE Dashboard Application SHALL display Widget 3 (corrida_espacial__sdr) occupying 25% of the viewport height in the bottom-right quadrant of View 3
4. THE Dashboard Application SHALL initialize Widget 2 using the Funifier SDK with widget identifier "corrida_espacial__referidos"

### Requirement 5

**User Story:** As a dashboard viewer, I want to see Widget 3 (SDR) prominently in View 4, so that I can focus on SDR team performance

#### Acceptance Criteria

1. THE Dashboard Application SHALL display Widget 3 (corrida_espacial__sdr) occupying 50% of the viewport height at the top of View 4
2. THE Dashboard Application SHALL display Widget 1 (espacial) occupying 25% of the viewport height in the bottom-left quadrant of View 4
3. THE Dashboard Application SHALL display Widget 2 (corrida_espacial__referidos) occupying 25% of the viewport height in the bottom-right quadrant of View 4
4. THE Dashboard Application SHALL initialize Widget 3 using the Funifier SDK with widget identifier "corrida_espacial__sdr"

### Requirement 6

**User Story:** As a dashboard viewer, I want all Funifier widgets to load and display correctly, so that I can see accurate gamification data

#### Acceptance Criteria

1. THE Dashboard Application SHALL load the Funifier JavaScript SDK from "https://client2.funifier.com/v3/funifier.js"
2. THE Dashboard Application SHALL initialize the Funifier SDK with API key "69027af6e179d46fce283e7e"
3. THE Dashboard Application SHALL authenticate with Funifier using the authorization token "Basic NjkwMjdhZjZlMTc5ZDQ2ZmNlMjgzZTdlOjY5MDI4MjI0ZTE3OWQ0NmZjZTI4NDI2ZA=="
4. THE Dashboard Application SHALL render each widget in its designated container element

### Requirement 7

**User Story:** As a dashboard viewer, I want the cycling to continue indefinitely, so that the dashboard remains useful for continuous monitoring

#### Acceptance Criteria

1. THE Dashboard Application SHALL continue cycling through views without stopping
2. WHEN the application starts, THE Dashboard Application SHALL begin the view cycle immediately
3. THE Dashboard Application SHALL maintain the 10-second interval timing throughout operation
