**ELECTRICITY CONSUMPTION ANOMALY DETECTION USING ML**

**Product Requirements Document (PRD) + Product/Project Design Document (PDD) + Kiro IDE Master Implementation Prompt**

Version 1.0 | Scope: Historical electricity-consumption anomaly detection with future real-time extension

Implementation stack: React.js + JavaScript, FastAPI + Python, PostgreSQL, scikit-learn

# 1\. Executive Summary

The system is a web-based machine-learning application that analyzes electricity-consumption data and identifies unusual consumption patterns. The current project scope is historical-data analysis. Users can analyze data either by selecting one of five predefined demo consumer numbers or by uploading a CSV/Excel dataset. Both paths use the same preprocessing, feature-engineering, and machine-learning pipeline.

Isolation Forest is the primary anomaly-detection model. K-Means and Local Outlier Factor (LOF) are used for comparison. The system presents actual model outputs through dashboards, charts, anomaly tables, model-comparison views, insights, and reports.

The application must not claim that it is connected to a real electricity board. The five consumer numbers are fictional/demo identifiers mapped to stable historical datasets stored in the application database. Real-time monitoring is a future extension requiring an authorized smart meter, IoT energy meter, or electricity-provider API.

# 2\. Problem Statement

Electricity consumers generate consumption patterns that can vary by time, season, and user behavior. Unusual patterns may indicate abnormal usage, unexpected spikes, or possible energy wastage. Manually examining large historical datasets is difficult. The proposed system automates preprocessing, anomaly detection, comparison of ML methods, and visualization.

Research gap: existing approaches may have limited adaptability to changing consumption patterns, seasonal variations, and changes in user behavior.

# 3\. Objectives

·       Build a web application for electricity-consumption anomaly detection.

·       Accept historical data through a demo consumer-number flow and CSV/Excel upload.

·       Validate and preprocess consumption data automatically.

·       Use Isolation Forest as the primary model.

·       Use K-Means and LOF for comparison.

·       Show real ML outputs rather than hardcoded or randomly generated results.

·       Provide charts, anomaly tables, model agreement, insights, and reports.

·       Provide authentication and protected user/admin functionality.

·       Provide an administrator panel for managing users, demo consumers, datasets, analyses, anomalies, reports, and system status.

·       Design the architecture so an authorized real-time data source can be added later.

# 4\. Scope

## 4.1 Current Scope

·       Historical electricity-consumption analysis only.

·       Five predefined fictional/demo 11-digit consumer numbers.

·       Consumer-number lookup to retrieve mapped historical data.

·       CSV/Excel dataset upload.

·       Shared ML pipeline for both input paths.

·       Isolation Forest, K-Means, and LOF.

·       Dashboard, visualizations, model comparison, anomaly analysis, history, and reports.

·       JWT authentication and role-based access.

·       Admin panel.

## 4.2 Future Scope

·       Integration with an authorized electricity-provider API.

·       Integration with smart meters or IoT energy meters.

·       Streaming/batch ingestion of new readings.

·       Incremental or scheduled model scoring.

·       Real-time dashboard updates.

·       Automated anomaly alerts/notifications.

·       Adaptive retraining for changing seasonal and behavioral patterns.

Important: the future real-time integration must require authorization, credentials, and a supported provider/meter interface. A consumer number alone cannot provide real-time readings.

# 5\. Target Users and Roles

·       User: registers/logs in, selects a demo consumer or uploads a dataset, runs analysis, views results/history/reports.

·       Admin: accesses the hidden admin route through the normal login mechanism, then manages application data and monitoring functions.

# 6\. Functional Requirements

## 6.1 Authentication

·       Registration, login, logout, JWT/session handling, protected routes.

·       Forgot-password flow may be included according to the existing auth implementation.

·       Never expose passwords in the frontend, API responses, logs, or admin tables.

·       Role values: USER and ADMIN.

## 6.2 Hidden Admin Login

·       Do not show an Admin Login option, button, tab, link, or label on the normal login page.

·       Admin uses the same normal login form.

·       Required admin credentials for the development environment: admin.subin@gmail.com / subadmin@31.

·       Credentials must be validated server-side and must not be hardcoded into React code.

·       Prefer a hashed admin account in the existing authentication database; alternatively load development credentials from backend environment/configuration.

·       Successful admin authentication redirects to /admin.

·       Normal users redirect to /dashboard.

·       Invalid credentials show the normal login error.

·       Direct access to /admin by a normal user must be blocked both in frontend routing and backend authorization.

## 6.3 Data Input

·       Option A: Use Consumer Number.

·       Option B: Upload Dataset.

·       Consumer number validation requires exactly 11 digits.

·       Invalid demo number: show a clear not-found message and allow retry or upload.

·       Uploaded CSV/Excel files must be validated before analysis.

·       Both input paths must be converted into a common internal schema such as timestamp/date/time/consumption\_kwh.

## 6.4 Five Demo Consumers

Seed exactly five fictional/demo consumer accounts. Do not use real consumer numbers.

·       Consumer 1: mostly normal consumption with a small number of controlled anomalies.

·       Consumer 2: generally higher consumption with identifiable peak anomalies.

·       Consumer 3: night-time irregular consumption patterns.

·       Consumer 4: seasonal consumption variation.

·       Consumer 5: multiple abnormal patterns/spikes.

Generate stable historical data with a fixed seed so repeated analysis does not change randomly. Store the generated data in PostgreSQL. Clearly label these accounts as demo/prototype data.

## 6.5 Consumer Flow

1.     User logs in.

2.     User opens My Consumption / Consumer Usage.

3.     User enters an 11-digit demo consumer number.

4.     Backend verifies the number.

5.     System displays masked consumer information, data period, record count, and preview statistics.

6.     User selects Analyze My Consumption.

7.     Historical data enters the common preprocessing and ML pipeline.

8.     Results are stored with an analysis ID.

9.     Dashboard and results pages display the actual model outputs.

## 6.6 Upload Flow

10.  User selects Upload Dataset.

11.  System validates file type and required consumption information.

12.  System detects or maps timestamp/date/time and consumption columns.

13.  Missing values, duplicates, invalid rows, and numeric conversion are handled according to preprocessing rules.

14.  User previews the cleaned dataset.

15.  User starts analysis.

16.  Same ML pipeline is executed.

# 7\. ML Requirements

## 7.1 Pipeline

Input Data -> Validation -> Cleaning -> Feature Engineering -> Scaling/Transformation where required -> ML Models -> Anomaly Results -> Visualization -> Insights/Report

## 7.2 Models

·       Isolation Forest: primary anomaly-detection model.

·       K-Means: clustering-based comparison; identify observations that are distant from or weakly associated with normal clusters according to the implemented scoring logic.

·       Local Outlier Factor (LOF): density-based comparison.

·       Use reproducible random\_state values where supported.

·       Do not fabricate anomaly counts, scores, labels, or charts.

## 7.3 Useful Features

·       Timestamp/date/time.

·       Consumption in kWh.

·       Hour of day.

·       Day of week.

·       Day/month/season indicators where available.

·       Rolling or lag-based features where appropriate and leakage-safe.

·       Optional additional meter fields if the uploaded dataset contains them, such as voltage, current, or power factor.

## 7.4 ML Output

·       Normal/anomaly label.

·       Model-specific anomaly score where supported.

·       K-Means cluster assignment and comparison score/logic.

·       LOF score where supported.

·       Model agreement: detected by all three, two, or one model.

·       Anomaly date/time and consumption value.

·       Summary statistics and insights.

# 8\. Dashboard Requirements

·       Total records.

·       Normal records.

·       Anomalies.

·       Anomaly rate.

·       Average consumption.

·       Peak consumption.

·       Minimum consumption.

·       Consumption trend.

·       Normal vs anomaly visualization.

·       Daily/hourly/monthly trend views where data supports them.

·       Anomaly timeline.

·       Model comparison.

·       Anomaly table.

·       Data-driven insights.

·       Report generation.

The dashboard must clearly distinguish a machine-learning anomaly from a confirmed electricity fault or confirmed energy wastage. An anomaly is an unusual pattern identified by the model, not proof of a real-world cause.

# 9\. Main Application Pages

·       Home

·       About

·       Login

·       Register

·       Forgot Password

·       Dashboard

·       My Consumption / Consumer Usage

·       Datasets

·       Upload Dataset

·       Data Preview

·       Preprocessing

·       ML Model Selection

·       Analysis

·       Results

·       Visualizations

·       Model Comparison

·       Reports

·       Analysis History

·       Profile

·       Settings

·       Help

# 10\. Admin Panel

## 10.1 Admin Sections

·       Admin Dashboard / Overview

·       Users

·       Consumers

·       Consumer Details

·       Datasets

·       Analyses

·       Anomalies

·       Model Comparison / Monitoring

·       Reports

·       Activity Logs

·       System Health

·       Admin Settings

·       Logout

## 10.2 Admin Dashboard

·       Total users and active users.

·       Five demo consumers.

·       Total datasets.

·       Total analyses.

·       Total anomalies.

·       Analyses this month.

·       Backend/API status.

·       Database status.

·       ML engine status.

·       Storage status.

·       Charts for registrations, analysis activity, anomaly trends, dataset activity, and model usage.

## 10.3 Admin Data Management

·       Search, filter, sort, and paginate users.

·       Enable/disable/delete users where permitted.

·       Never display passwords.

·       View and manage five demo consumers.

·       View/replace historical consumption data.

·       View user-uploaded datasets.

·       View analysis records and results.

·       View system-wide anomaly records.

·       View generated reports.

·       View activity logs.

·       View system health.

# 11\. Admin APIs

GET    /api/admin/dashboard  
GET    /api/admin/users  
GET    /api/admin/users/{id}  
PATCH  /api/admin/users/{id}/status  
DELETE /api/admin/users/{id}  
GET    /api/admin/consumers  
POST   /api/admin/consumers  
GET    /api/admin/consumers/{id}  
PATCH  /api/admin/consumers/{id}  
DELETE /api/admin/consumers/{id}  
GET    /api/admin/datasets  
GET    /api/admin/analyses  
GET    /api/admin/anomalies  
GET    /api/admin/reports  
GET    /api/admin/activity  
GET    /api/admin/system-health

# 12\. Core API Requirements

POST /api/auth/register  
POST /api/auth/login  
POST /api/consumers/verify  
GET  /api/consumers/{consumer\_id}  
GET  /api/consumers/{consumer\_id}/consumption  
POST /api/consumers/{consumer\_id}/analyze  
POST /api/datasets/upload  
POST /api/analysis  
GET  /api/analysis/{analysis\_id}/results  
GET  /api/analysis/{analysis\_id}/anomalies  
GET  /api/history  
GET  /api/reports/{report\_id}

# 13\. Data Model

·       users: id, email, password\_hash, name, role, status, created\_at, updated\_at.

·       electricity\_consumers: id, consumer\_number, consumer\_name, email, connection\_type, location, meter\_type, data\_start\_date, data\_end\_date, total\_records, created\_at.

·       electricity\_consumption: id, consumer\_id, timestamp, date, time, consumption\_kwh, created\_at.

·       datasets: id, user\_id, name, source\_type, file\_path/metadata, record\_count, status, created\_at.

·       analyses: id, user\_id, consumer\_id/dataset\_id, models\_used, record\_count, anomaly\_count, status, processing\_time, created\_at.

·       anomalies: id, analysis\_id, timestamp, consumption\_kwh, model labels/scores, agreement\_count, created\_at.

·       reports: id, analysis\_id, user\_id, report\_type, path/metadata, created\_at.

·       activity\_logs: id, user\_id/admin\_id, action, entity\_type, entity\_id, metadata, created\_at.

# 14\. Recommended Project Structure

frontend/  
  src/  
    components/  
    pages/  
    services/  
    auth/  
    admin/  
      components/  
      pages/  
      adminService.js  
    routes/  
    utils/  
  
backend/  
  app/  
    main.py  
    api/  
      auth.py  
      consumers.py  
      datasets.py  
      analysis.py  
      reports.py  
      admin.py  
    models/  
    schemas/  
    services/  
      preprocessing.py  
      feature\_engineering.py  
      anomaly\_detection.py  
      reporting.py  
    ml/  
      isolation\_forest.py  
      kmeans.py  
      lof.py  
    db/  
    core/  
    utils/  
  scripts/  
    seed\_demo\_consumers.py  
  

# 15\. UI/UX Requirements

·       Professional academic/technology dashboard.

·       Responsive desktop and mobile layouts.

·       Clear navigation and readable charts.

·       Use consistent cards, tables, filters, loading states, empty states, success states, and error states.

·       Clearly label demo consumer data.

·       Mask consumer numbers in normal displays, e.g. 123\*\*\*\*\*901.

·       Do not place an Admin option in normal user navigation or login UI.

·       Admin interface should be visually distinct but must not expose an admin entry point to ordinary users.

# 16\. Security Requirements

·       JWT/session authentication.

·       Role-based authorization on the backend.

·       ADMIN-only protection for /api/admin/\*.

·       AdminProtectedRoute on the frontend.

·       Hash passwords; never store plaintext passwords in the database.

·       Never hardcode the admin password in React.

·       Keep secrets in backend environment variables/configuration and exclude .env from Git.

·       Validate uploaded files and inputs.

·       Use parameterized ORM/database queries.

·       Do not expose sensitive logs.

·       Do not log passwords or authentication secrets.

# 17\. Real-Time Extension Design

Real-time monitoring is NOT part of the current implementation requirement. The architecture must simply remain extensible.

## 17.1 Future Data Flow

Smart Meter / Authorized Electricity Provider API -> Secure Ingestion API -> Validation -> Time-Series Storage -> Feature Engineering -> Trained Model Scoring -> Anomaly Event -> Dashboard / Alert

## 17.2 Possible Interfaces

·       Authorized electricity-provider API.

·       Smart meter API.

·       IoT energy meter using an appropriate authenticated protocol/gateway.

·       Scheduled batch API polling if the provider does not support streaming.

The system must never imply that a consumer number by itself gives access to real-time data. Provider permission, API credentials, meter connectivity, and data-access agreements are required.

# 18\. Reports

·       Consumer/dataset identification.

·       Analysis date and record period.

·       Preprocessing summary.

·       Model configuration.

·       Anomaly counts.

·       Model-specific findings.

·       Model agreement.

·       Charts.

·       Key data-driven insights.

·       Disclaimer that anomalies indicate unusual patterns and do not prove a physical fault or wastage.

# 19\. Non-Functional Requirements

·       Stable and reproducible demo datasets.

·       Reasonable response times for normal historical datasets.

·       Graceful error handling.

·       API documentation through FastAPI/OpenAPI.

·       Maintainable modular code.

·       Clear separation between frontend, backend, database, and ML services.

·       Test critical authentication, consumer verification, preprocessing, model execution, and admin authorization paths.

# 20\. Acceptance Criteria

17.  User can register and log in normally.

18.  Admin can use the same login form with the specified development credentials and reach /admin.

19.  No Admin option/button/link appears on the normal login page or normal user navigation.

20.  Admin access is enforced by backend role authorization.

21.  Exactly five fictional/demo consumer accounts are seeded.

22.  Entering a valid demo consumer number retrieves stable historical data.

23.  Entering an invalid number gives a clear error.

24.  CSV/Excel upload works through a separate input path.

25.  Consumer-number and upload data use the same ML pipeline.

26.  Isolation Forest, K-Means, and LOF execute on actual data.

27.  Results are not hardcoded or randomly generated per request.

28.  Dashboard displays actual computed statistics and charts.

29.  Analysis history and reports are persisted.

30.  Admin can manage users, consumers, datasets, analyses, anomalies, reports, activity, and system health.

31.  No passwords are exposed.

32.  The application does not claim live electricity-board integration.

33.  Architecture documents real-time smart-meter/provider integration as future scope.

# 21\. KIRO IDE MASTER IMPLEMENTATION PROMPT

Paste the following prompt into Kiro IDE. It is designed to make Kiro inspect the existing project before changing code, preserve working features, and implement the complete system incrementally.

You are the lead full-stack engineer implementing my final-year B.Sc AI & ML project:  
  
PROJECT TITLE:  
Electricity Consumption Anomaly Detection using ML  
  
IMPORTANT:  
Build and integrate this system into the existing repository. Do NOT blindly rebuild the project. First inspect the complete existing frontend, backend, database, authentication, ML code, routes, environment configuration, and documentation. Preserve working functionality and modify only what is required.  
  
TECH STACK:  
\- Frontend: React.js with JavaScript only. NO TypeScript.  
\- Backend: Python FastAPI.  
\- Database: PostgreSQL.  
\- ML: Python, pandas, NumPy, scikit-learn, joblib where appropriate.  
\- Charts: use the chart library already present; if none exists, use a suitable React chart library.  
\- Authentication: JWT or the existing secure authentication system.  
\- API documentation: FastAPI/OpenAPI.  
  
CURRENT PROJECT SCOPE:  
This project currently analyzes HISTORICAL electricity-consumption data. It is NOT connected to a real electricity board and must NOT claim to have live electricity data.  
  
The system must support two data-entry paths:  
1\. Use Consumer Number  
2\. Upload Dataset  
  
Both paths MUST feed the same preprocessing and ML pipeline.  
  
\==================================================  
1\. FIRST: REPOSITORY AUDIT  
\==================================================  
  
Before modifying code:  
1\. Inspect all existing frontend files.  
2\. Inspect all existing backend files.  
3\. Inspect database models/migrations/schema.  
4\. Inspect authentication and authorization.  
5\. Inspect existing ML/preprocessing code.  
6\. Inspect existing routes and API services.  
7\. Inspect package/dependency files.  
8\. Inspect .env and .gitignore configuration without exposing secrets.  
9\. Identify what is already implemented.  
10\. Identify missing functionality.  
11\. Create a concise implementation plan based on the actual repository.  
  
Do not delete or replace working features unnecessarily.  
Do not create duplicate services when an existing service can be extended.  
Follow the existing code conventions where reasonable.  
  
\==================================================  
2\. PRODUCT GOAL  
\==================================================  
  
Build a professional web application that:  
\- accepts historical electricity-consumption data,  
\- preprocesses it,  
\- engineers useful time-based features,  
\- detects anomalies,  
\- compares three ML approaches,  
\- visualizes results,  
\- generates reports,  
\- stores analysis history,  
\- supports five predefined demo consumer accounts,  
\- supports dataset upload,  
\- includes authentication,  
\- includes a secure hidden admin panel.  
  
Primary model:  
\- Isolation Forest  
  
Comparison models:  
\- K-Means  
\- Local Outlier Factor (LOF)  
  
Use ACTUAL ML OUTPUTS.  
NEVER hardcode anomaly counts, anomaly scores, chart values, model results, or dashboard statistics.  
NEVER generate new random results every time a page loads.  
  
\==================================================  
3\. FIVE DEMO CONSUMERS  
\==================================================  
  
Create exactly five fictional/demo consumer accounts.  
  
IMPORTANT:  
\- Do not use real electricity consumer numbers.  
\- Clearly label them as DEMO/PROTOTYPE accounts.  
\- Use stable 11-digit Tamil Nadu-style numbers.  
\- Seed the data using fixed/random seeds so the historical datasets are reproducible.  
  
Suggested behavior:  
Consumer 1:  
\- Mostly normal consumption  
\- Small controlled number of anomalies  
  
Consumer 2:  
\- Higher general consumption  
\- Clear high-usage peaks  
  
Consumer 3:  
\- Night-time irregularities  
  
Consumer 4:  
\- Seasonal pattern changes  
  
Consumer 5:  
\- Multiple abnormal spikes/patterns  
  
Store the consumer metadata and historical readings in PostgreSQL.  
  
Suggested tables:  
electricity\_consumers  
\- id  
\- consumer\_number  
\- consumer\_name  
\- email  
\- connection\_type  
\- location  
\- meter\_type  
\- data\_start\_date  
\- data\_end\_date  
\- total\_records  
\- created\_at  
  
electricity\_consumption  
\- id  
\- consumer\_id  
\- timestamp  
\- date  
\- time  
\- consumption\_kwh  
\- created\_at  
  
\==================================================  
4\. CONSUMER NUMBER FLOW  
\==================================================  
  
Frontend:  
Create:  
\- My Consumption / Consumer Usage page  
\- 11-digit consumer-number input  
\- Verify button  
\- Clear validation  
\- Demo-data notice  
  
User enters an 11-digit number.  
  
Call:  
POST /api/consumers/verify  
  
If valid:  
\- return consumer ID  
\- masked consumer number  
\- demo/prototype label  
\- consumer metadata  
\- data start date  
\- data end date  
\- record count  
\- basic statistics  
  
Then show:  
\- data preview  
\- average consumption  
\- peak consumption  
\- minimum consumption  
\- record count  
\- Analyze My Consumption button  
  
When Analyze My Consumption is clicked:  
POST /api/consumers/{consumer\_id}/analyze  
  
Then redirect to results using analysis ID.  
  
If invalid:  
Show:  
"Consumer number not found in the demo system."  
  
Provide:  
\- Try Again  
\- Upload Dataset Instead  
  
Mask consumer numbers in normal displays, for example:  
123\*\*\*\*\*901  
  
\==================================================  
5\. DATASET UPLOAD  
\==================================================  
  
Support:  
\- CSV  
\- Excel  
  
Validate:  
\- file type  
\- empty file  
\- invalid rows  
\- missing consumption column  
\- invalid timestamps  
\- duplicate records  
\- non-numeric consumption values  
  
The uploaded dataset may use flexible column names.  
  
Implement mapping/detection for likely fields such as:  
\- timestamp  
\- date  
\- time  
\- consumption  
\- consumption\_kwh  
\- energy  
\- energy\_consumption  
  
Normalize to an internal schema:  
timestamp  
date  
time  
consumption\_kwh  
  
Show a preview before analysis.  
  
Do not silently accept completely invalid datasets.  
  
\==================================================  
6\. SHARED ML PIPELINE  
\==================================================  
  
Both:  
Consumer Number -> historical database data  
AND  
Dataset Upload -> uploaded data  
  
MUST eventually become the same internal dataframe structure.  
  
Pipeline:  
  
INPUT  
\-> validation  
\-> cleaning  
\-> missing-value handling  
\-> duplicate handling  
\-> timestamp conversion  
\-> sorting  
\-> feature engineering  
\-> model execution  
\-> anomaly results  
\-> visualization  
\-> insights  
\-> report  
\-> history  
  
Useful features:  
\- consumption\_kwh  
\- hour  
\- day\_of\_week  
\- day  
\- month  
\- season where appropriate  
\- lag/rolling features where safe  
  
Avoid data leakage.  
  
\==================================================  
7\. MACHINE LEARNING  
\==================================================  
  
PRIMARY:  
Isolation Forest  
  
COMPARISON:  
K-Means  
Local Outlier Factor  
  
Isolation Forest:  
\- train/fit on the prepared historical dataset  
\- generate anomaly labels  
\- generate anomaly scores  
\- use reproducible random\_state  
\- expose contamination/configuration where appropriate  
  
K-Means:  
\- choose a justified cluster configuration  
\- calculate cluster assignment  
\- implement a documented anomaly-scoring approach based on distance/cluster behavior  
\- do not pretend K-Means is inherently an anomaly detector; clearly document the implemented scoring method  
  
LOF:  
\- generate outlier labels  
\- expose/record the LOF score according to scikit-learn behavior  
\- handle dataset-size limitations safely  
  
Persist:  
\- model names  
\- parameters  
\- analysis ID  
\- anomaly counts  
\- model-specific scores/labels  
\- processing time  
\- timestamps  
  
Do not fabricate results.  
  
\==================================================  
8\. RESULTS  
\==================================================  
  
Create a Results page containing:  
\- total records  
\- normal records  
\- anomaly count  
\- anomaly rate  
\- average consumption  
\- peak consumption  
\- minimum consumption  
\- model comparison  
\- anomaly table  
\- anomaly timeline  
\- model agreement  
  
Model agreement:  
\- detected by all 3  
\- detected by 2 models  
\- detected by 1 model  
  
Anomaly table should include, where available:  
\- timestamp  
\- date  
\- time  
\- consumption\_kwh  
\- Isolation Forest label/score  
\- K-Means cluster/scoring information  
\- LOF label/score  
\- agreement  
  
IMPORTANT:  
An anomaly is a machine-learning indication of unusual behavior.  
Do not describe an anomaly as confirmed electricity theft, confirmed equipment failure, or confirmed energy wastage.  
  
\==================================================  
9\. DASHBOARD  
\==================================================  
  
Create a professional dashboard with:  
\- Total Records  
\- Normal Records  
\- Anomalies  
\- Anomaly Rate  
\- Average Consumption  
\- Peak Consumption  
\- Minimum Consumption  
  
Charts:  
\- consumption trend  
\- normal vs anomaly  
\- daily consumption  
\- hourly pattern  
\- monthly/seasonal pattern when enough data exists  
\- anomaly timeline  
\- model comparison  
\- model usage if useful  
  
Use real backend data.  
  
No fake placeholder statistics in the final implementation.  
  
\==================================================  
10\. APPLICATION PAGES  
\==================================================  
  
Preserve existing pages if already implemented.  
  
Required functional areas:  
\- Home  
\- About  
\- Login  
\- Register  
\- Forgot Password if supported  
\- Dashboard  
\- My Consumption / Consumer Usage  
\- Datasets  
\- Upload Dataset  
\- Data Preview  
\- Preprocessing  
\- Analysis / Model Selection  
\- Results  
\- Visualizations  
\- Model Comparison  
\- Reports  
\- Analysis History  
\- Profile  
\- Settings  
\- Help  
  
\==================================================  
11\. AUTHENTICATION  
\==================================================  
  
Implement secure authentication.  
  
User roles:  
USER  
ADMIN  
  
Never expose passwords.  
  
Passwords must be hashed.  
  
Use JWT/session according to the existing project architecture.  
  
Protect user data.  
  
\==================================================  
12\. HIDDEN ADMIN LOGIN  
\==================================================  
  
CRITICAL REQUIREMENT:  
  
There must be NO:  
\- Admin Login button  
\- Admin tab  
\- Admin link  
\- Admin option  
\- Admin label  
\- separate admin login form  
  
on the normal login page or normal user UI.  
  
The administrator uses the SAME normal login form.  
  
Development admin credentials:  
Email:  
admin.subin@gmail.com  
  
Password:  
subadmin@31  
  
CRITICAL SECURITY:  
DO NOT hardcode these credentials in React/frontend JavaScript.  
  
Validate them on the backend.  
  
Preferred implementation:  
\- create a role-based admin account in the existing users/authentication database  
\- store only password\_hash  
\- role = ADMIN  
\- status = ACTIVE  
  
If the current architecture requires environment configuration for initial bootstrap, use backend-only environment variables and never expose them to frontend code.  
  
Never commit secrets to GitHub.  
Ensure .env is ignored.  
  
Successful admin login:  
\-> /admin  
  
Normal user login:  
\-> /dashboard  
  
Invalid login:  
\-> normal login error  
  
A normal USER manually opening /admin:  
\-> frontend blocks access  
AND  
\-> backend returns unauthorized/forbidden for admin APIs  
  
\==================================================  
13\. ADMIN PANEL  
\==================================================  
  
Create:  
src/admin/  
  
Suggested:  
src/admin/components/  
src/admin/pages/  
src/admin/adminService.js  
  
Pages:  
AdminDashboard  
AdminUsers  
AdminUserDetails  
AdminConsumers  
AdminConsumerDetails  
AdminDatasets  
AdminAnalyses  
AdminAnomalies  
AdminReports  
AdminActivity  
AdminSystem  
AdminSettings  
  
Components:  
AdminSidebar  
AdminHeader  
AdminStatCard  
AdminDataTable  
AdminChart  
ConfirmDialog  
AdminProtectedRoute  
  
Admin sections:  
1\. Dashboard  
2\. Users  
3\. Consumers  
4\. Datasets  
5\. Analyses  
6\. Anomalies  
7\. Model Comparison/Monitoring  
8\. Reports  
9\. Activity Logs  
10\. System Health  
11\. Admin Settings  
12\. Logout  
  
\==================================================  
14\. ADMIN DASHBOARD  
\==================================================  
  
All values MUST come from the database/health checks.  
  
Show:  
\- total users  
\- active users  
\- demo consumers  
\- total datasets  
\- total analyses  
\- total anomalies  
\- analyses this month  
\- API status  
\- database status  
\- ML engine status  
\- storage status  
  
Charts:  
\- user registration trend  
\- analysis activity  
\- anomaly trend  
\- dataset activity  
\- model usage  
  
\==================================================  
15\. ADMIN USER MANAGEMENT  
\==================================================  
  
Admin can:  
\- search users  
\- filter users  
\- paginate  
\- view user details  
\- enable/disable user  
\- delete user if allowed  
  
Never show:  
\- password  
\- password hash  
\- secret tokens  
  
\==================================================  
16\. ADMIN CONSUMER MANAGEMENT  
\==================================================  
  
Admin can:  
\- list five demo consumers  
\- view consumer details  
\- view historical data  
\- edit metadata  
\- replace historical dataset  
\- add/delete consumers if the business rules allow  
\- run analysis  
\- view analysis history  
  
Clearly distinguish DEMO/PROTOTYPE data from real data.  
  
\==================================================  
17\. ADMIN DATASET MANAGEMENT  
\==================================================  
  
Admin can:  
\- view datasets  
\- filter/search  
\- inspect metadata  
\- view record count  
\- view source type  
\- download where supported  
\- delete where permitted  
\- trigger analysis  
  
\==================================================  
18\. ADMIN ANALYSIS MANAGEMENT  
\==================================================  
  
Show:  
\- analysis ID  
\- user  
\- consumer/dataset  
\- created date  
\- record count  
\- models used  
\- anomaly count  
\- status  
\- processing time  
  
Analysis details:  
\- preprocessing summary  
\- model parameters  
\- model results  
\- visualizations  
\- anomaly records  
  
\==================================================  
19\. ADMIN ANOMALY MANAGEMENT  
\==================================================  
  
Show:  
\- consumer/dataset  
\- date/time  
\- consumption  
\- Isolation Forest score  
\- K-Means information  
\- LOF score  
\- model agreement  
  
Filters:  
\- consumer  
\- model  
\- date  
\- agreement/status  
  
\==================================================  
20\. REPORTS  
\==================================================  
  
Generate reports from actual analysis results.  
  
Include:  
\- data period  
\- record count  
\- preprocessing  
\- model configuration  
\- anomaly counts  
\- model comparison  
\- model agreement  
\- charts  
\- insights  
\- disclaimer  
  
Do not claim an anomaly proves a physical problem.  
  
\==================================================  
21\. ACTIVITY LOGS  
\==================================================  
  
Log actions such as:  
\- user registered  
\- user logged in  
\- consumer verified  
\- dataset uploaded  
\- dataset deleted  
\- analysis started  
\- analysis completed  
\- report generated  
\- admin logged in  
\- consumer updated  
\- user disabled  
  
NEVER log passwords or authentication secrets.  
  
\==================================================  
22\. SYSTEM HEALTH  
\==================================================  
  
Create:  
GET /api/admin/system-health  
  
Check:  
\- backend API  
\- database connection  
\- ML engine availability  
\- storage if used  
  
Show:  
\- healthy  
\- degraded  
\- unavailable  
  
Do not fake health status.  
  
\==================================================  
23\. ADMIN API  
\==================================================  
  
Create/protect:  
  
GET    /api/admin/dashboard  
GET    /api/admin/users  
GET    /api/admin/users/{id}  
PATCH  /api/admin/users/{id}/status  
DELETE /api/admin/users/{id}  
GET    /api/admin/consumers  
POST   /api/admin/consumers  
GET    /api/admin/consumers/{id}  
PATCH  /api/admin/consumers/{id}  
DELETE /api/admin/consumers/{id}  
GET    /api/admin/datasets  
GET    /api/admin/analyses  
GET    /api/admin/anomalies  
GET    /api/admin/reports  
GET    /api/admin/activity  
GET    /api/admin/system-health  
  
Every /api/admin/\* endpoint MUST enforce ADMIN authorization on the backend.  
  
\==================================================  
24\. CORE API  
\==================================================  
  
Use the existing API style if already present.  
  
Required functionality:  
  
POST /api/auth/register  
POST /api/auth/login  
  
POST /api/consumers/verify  
GET /api/consumers/{consumer\_id}  
GET /api/consumers/{consumer\_id}/consumption  
POST /api/consumers/{consumer\_id}/analyze  
  
POST /api/datasets/upload  
POST /api/analysis  
  
GET /api/analysis/{analysis\_id}/results  
GET /api/analysis/{analysis\_id}/anomalies  
GET /api/history  
  
GET /api/reports/{report\_id}  
  
\==================================================  
25\. DATABASE  
\==================================================  
  
Use PostgreSQL.  
  
Required conceptual tables:  
\- users  
\- electricity\_consumers  
\- electricity\_consumption  
\- datasets  
\- analyses  
\- anomalies  
\- reports  
\- activity\_logs  
  
Add role/status fields to users if required.  
  
Use proper foreign keys and indexes.  
  
Index useful fields such as:  
\- consumer\_number  
\- consumer\_id  
\- timestamp  
\- analysis\_id  
\- user\_id  
\- created\_at  
  
Use migrations if the existing project supports them.  
  
\==================================================  
26\. REAL-TIME DATA: FUTURE ONLY  
\==================================================  
  
DO NOT implement or claim real-time electricity-provider integration in the current project unless an authorized API actually exists.  
  
Design the code so this can be added later.  
  
Future architecture:  
  
Smart Meter / Authorized Provider API  
        |  
        v  
Secure Data Ingestion Layer  
        |  
        v  
Validation  
        |  
        v  
Database / Time-Series Storage  
        |  
        v  
Feature Engineering  
        |  
        v  
Isolation Forest / Other Model Scoring  
        |  
        v  
Anomaly Event  
        |  
        +--> Dashboard  
        |  
        +--> Alert/Notification  
  
Possible future sources:  
\- authorized electricity-provider API  
\- smart meter  
\- IoT energy meter  
  
A consumer number alone DOES NOT provide real-time consumption data.  
  
The project documentation should explicitly say:  
"The current prototype analyzes historical electricity consumption. Real-time monitoring is a future extension that would require an authorized smart-meter, IoT meter, or electricity-provider API."  
  
\==================================================  
27\. ERROR HANDLING  
\==================================================  
  
Implement clear errors for:  
\- invalid login  
\- unauthorized admin  
\- consumer not found  
\- invalid consumer number  
\- invalid file  
\- missing consumption field  
\- invalid timestamps  
\- empty dataset  
\- insufficient records for ML  
\- model failure  
\- database failure  
\- report generation failure  
  
Do not expose stack traces or secrets to users.  
  
\==================================================  
28\. TESTING  
\==================================================  
  
Add or update tests for:  
\- registration/login  
\- admin login  
\- role authorization  
\- direct /admin access  
\- consumer verification  
\- invalid consumer number  
\- demo dataset retrieval  
\- upload validation  
\- preprocessing  
\- Isolation Forest  
\- K-Means  
\- LOF  
\- analysis persistence  
\- anomaly results  
\- admin API protection  
  
Run:  
\- backend tests  
\- frontend tests if configured  
\- linting  
\- build  
\- type check only if relevant; this is a JavaScript project so do not introduce TypeScript.  
  
\==================================================  
29\. DOCUMENTATION  
\==================================================  
  
Update README/documentation with:  
\- project overview  
\- architecture  
\- setup  
\- environment variables  
\- database setup  
\- demo consumer setup  
\- how to run frontend  
\- how to run backend  
\- ML workflow  
\- admin access for development  
\- security notes  
\- limitations  
\- future real-time extension  
  
Do not put the development admin password into public README files.  
  
\==================================================  
30\. IMPORTANT ACADEMIC WORDING  
\==================================================  
  
Use this concept in documentation/presentation:  
  
"The consumer number identifies the electricity account. In this prototype, each demo consumer account is mapped to historical electricity consumption data stored in the application's database. The retrieved historical data is then passed through preprocessing and machine-learning algorithms to identify potentially unusual consumption patterns."  
  
For real-time future scope:  
  
"For real-time monitoring, the system can be extended by connecting to an authorized smart meter, IoT energy meter, or electricity-provider API. Incoming readings would be securely ingested, processed, scored by the anomaly-detection model, and displayed on the dashboard."  
  
Do not claim the current system is connected to a real electricity board.  
  
\==================================================  
31\. FINAL IMPLEMENTATION RULES  
\==================================================  
  
\- Inspect before editing.  
\- Reuse existing code where possible.  
\- Do not rebuild unrelated features.  
\- React JavaScript only.  
\- FastAPI/Python backend.  
\- PostgreSQL.  
\- Isolation Forest primary.  
\- K-Means and LOF comparison.  
\- Actual ML outputs only.  
\- Five stable fictional demo consumers.  
\- Consumer number and upload paths share one ML pipeline.  
\- Hidden admin mechanism through normal login.  
\- Backend-enforced ADMIN role.  
\- Never expose admin password.  
\- No Admin option in normal UI.  
\- No fake statistics.  
\- No fake real-time integration.  
\- No claim of real electricity-board connectivity.  
\- Clearly distinguish demo data from real data.  
\- Keep real-time integration as future scope.  
\- Finish with tests, lint/build checks, migration/seed instructions, and a concise list of changed files.  
  
IMPLEMENTATION ORDER:  
Phase 1: repository audit and plan  
Phase 2: database/schema/migrations  
Phase 3: authentication and role protection  
Phase 4: five demo consumers and seed data  
Phase 5: consumer-number flow  
Phase 6: upload flow  
Phase 7: shared preprocessing  
Phase 8: ML models  
Phase 9: results/dashboard/visualizations  
Phase 10: reports/history  
Phase 11: admin panel  
Phase 12: tests/security validation  
Phase 13: documentation and final verification  
  
At the end, report:  
1\. What was already present.  
2\. What was implemented.  
3\. Files created/modified.  
4\. Database/migration changes.  
5\. APIs added/changed.  
6\. How to seed demo consumers.  
7\. How to run frontend/backend.  
8\. How to test normal user login.  
9\. How to test development admin login.  
10\. How to verify unauthorized users cannot access admin APIs.  
11\. Test/lint/build results.  
12\. Any remaining limitations.  
  
Do not stop after creating UI mockups. Implement the backend, database, ML pipeline, API integration, persistence, authorization, and frontend integration end-to-end.  
  

# 22\. HOD Viva / Review Answer

If the HOD asks: “How will you connect this system with real-time electricity data?”

Recommended answer:

“Currently, our project focuses on historical electricity-consumption data. For real-time monitoring, the system can be extended by connecting it to a smart meter, IoT energy meter, or an authorized electricity-provider API. The incoming readings would be sent securely to our backend, where they would be validated and preprocessed before being passed to the trained anomaly-detection model. The detected anomalies could then be displayed on the dashboard and alerts could be generated. A consumer number alone cannot provide real-time readings; an authorized data source and access permission are required.”

If asked whether it is implemented now:

“No. Real-time integration is future scope. The current implementation focuses on historical data and the anomaly-detection pipeline.”

# 23\. Final Project Positioning

Current system: historical electricity consumption anomaly detection using machine learning.

Primary ML: Isolation Forest.

Comparison: K-Means and LOF.

Data access: five fictional demo consumer numbers + CSV/Excel upload.

Backend: FastAPI/Python.

Frontend: React.js/JavaScript.

Database: PostgreSQL.

Security: JWT/role-based authentication with a hidden admin route.

Future extension: authorized smart-meter/IoT/electricity-provider real-time ingestion.

Research gap: limited adaptability to changing consumption patterns, seasonal variations, and user behavior.