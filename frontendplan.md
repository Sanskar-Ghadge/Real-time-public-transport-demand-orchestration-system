I have an existing frontend for a Smart Bus Transit Management System.

I want you to REVIEW the entire project before making any changes.

IMPORTANT:
Do NOT invent features, technologies, ML models, datasets, APIs, statistics, bus counts, routes, or capabilities.

First inspect the complete project, including:
- frontend source code
- backend source code
- API endpoints
- database/data files
- ML models
- training/inference code
- configuration files
- package.json / requirements.txt
- README and documentation
- existing routes/pages/components

Your first task is to understand what the project ACTUALLY does.

Then compare the current frontend content with the actual implementation.

==================================================
PROJECT GOAL
==================================================

The website is a smart bus transit platform.

The frontend should clearly communicate:

1. What the project does
2. How a user accesses and uses the website
3. What each module does
4. How the system works internally
5. What AI/ML components are actually implemented
6. What technologies are actually used
7. How data flows through the system
8. What benefits the system provides to transit operators/users

The website should NOT look like a generic AI demo.

It should look like a professional Smart Bus Transit Management / Intelligent Public Transportation platform.

==================================================
CURRENT FRONTEND
==================================================

The current frontend has a dark futuristic dashboard design with:

- Home
- Live Map
- Demand
- Anomalies
- Events
- System Online indicator
- 3D visualization
- Live City Map
- Demand Forecast
- Anomaly Scanner
- Event Impact
- Platform/Operator Guide

Keep the overall visual quality and futuristic 3D style if appropriate.

However, REVIEW ALL TEXT because some current content may be placeholder or inaccurate.

For example, the current UI contains terms such as:

"Chicago Transit Command"
"CTA buses"
"20 buses"
"PyTorch LSTM"
"Isolation Forest"
"XGBoost"
"Real-Time Network Telemetry"
"Holographic Operator Console"

Do NOT automatically keep these.

Verify every such claim against the actual project implementation.

If the project is not specifically a Chicago/CTA system, remove Chicago/CTA-specific branding and replace it with a project-appropriate generic or actual location name.

If an ML model is not actually implemented, do not mention it.

If a feature is not actually implemented, do not present it as an available feature.

==================================================
REQUIRED HOMEPAGE STRUCTURE
==================================================

Redesign/rewrite the homepage content around these sections:

1. HERO SECTION

Clearly explain:

- What the platform is
- What problem it solves
- Main capabilities
- Primary actions

Example structure:

"Smart Bus Transit Management System"

"An intelligent transit platform for real-time bus monitoring, passenger-demand analysis, anomaly detection, and operational planning."

Buttons:

- Explore Live Map
- View Demand Forecast
- How It Works

Use the actual implemented capabilities rather than copying this example blindly.

--------------------------------------------------

2. REAL-TIME TRANSIT OVERVIEW

Show the actual available system information.

Possible cards, ONLY if supported by the backend:

- Active Buses
- Routes
- Average Occupancy
- Current Demand
- Delayed Buses
- System Status

Do not hard-code fake numbers.

If the backend provides live values, fetch and display them dynamically.

--------------------------------------------------

3. MAIN MODULES

Create clear cards for the actual modules.

Possible modules:

A. Live Transit Map
Explain how users can:
- view buses
- select a bus
- inspect its information
- view routes
- understand bus status

B. Demand Forecast
Explain:
- what demand prediction means
- what data is used
- what the prediction represents
- how users can interpret it

C. Anomaly Detection
Explain:
- what constitutes an anomaly in this project
- what the model/system detects
- how alerts are presented

D. Event Impact
Explain:
- how events influence transit demand
- how the system uses event information
- what operational decisions can be supported

Only include modules that actually exist.

--------------------------------------------------

4. HOW TO USE THE WEBSITE

Create a dedicated section called:

"How to Use the Platform"

Give the user a simple step-by-step guide.

Example:

Step 1:
Open the Live Map.

Step 2:
Select a bus or route.

Step 3:
View current bus information.

Step 4:
Open Demand to view predicted passenger demand.

Step 5:
Open Anomalies to inspect unusual transit conditions.

Step 6:
Open Events to understand event-related demand.

Step 7:
Use the combined information for transit planning.

Modify these steps according to the actual application.

--------------------------------------------------

5. HOW THE PROJECT WORKS

Create a visually attractive system architecture / pipeline section.

Explain the actual data flow:

Data Sources
→ Data Processing
→ Feature Engineering
→ ML/AI Processing
→ Prediction/Detection
→ Decision/Analysis
→ Backend API
→ 3D/Web Dashboard

Use the actual architecture discovered from the source code.

For every AI/ML component, explain in SIMPLE LANGUAGE:

- What it does
- What input it receives
- What output it produces
- Where it is used in the application

Do not provide fake explanations.

--------------------------------------------------

6. TECHNOLOGY STACK

Create a clean technology section.

Categorize technologies as:

Frontend
Backend
Database
Machine Learning
Visualization
APIs
Deployment

Only list technologies actually present in the project.

Read package.json, requirements.txt and source code to verify them.

--------------------------------------------------

7. DATA FLOW

Create a section explaining:

Where data comes from
↓
How it is processed
↓
How ML models use it
↓
How predictions/anomalies are generated
↓
How backend APIs expose results
↓
How frontend visualizes them

Make this understandable to a student, professor, evaluator, and normal user.

--------------------------------------------------

8. 3D VISUALIZATION EXPLANATION

Explain why the project uses 3D visualization.

For example:

- Represent bus movement spatially
- Display routes and locations
- Make transit activity easier to understand
- Visualize demand hotspots
- Provide an interactive operational view

Only claim capabilities that are actually implemented.

Also provide simple instructions such as:

"Drag to rotate"
"Scroll to zoom"
"Click a bus to inspect it"

ONLY if these interactions actually exist.

--------------------------------------------------

9. AI/ML EXPLANATION

Create a dedicated "AI Behind the Platform" section.

For every actual model:

Model name
↓
Purpose
↓
Input
↓
Processing
↓
Output
↓
Where output appears in the website

Explain it in simple language.

Do not use unnecessarily complicated terminology.

--------------------------------------------------

10. PROJECT ARCHITECTURE

Create a clean architecture diagram showing:

Frontend
↓
Backend/API
↓
Data Processing
↓
ML Models
↓
Data Storage / Dataset

Use the actual project structure.

--------------------------------------------------

11. ABOUT THE PROJECT

Add a concise section explaining:

- Problem
- Proposed solution
- Key innovation
- Real-world usefulness
- Expected users

Use information from the actual project.

--------------------------------------------------

12. USER VS OPERATOR INFORMATION

Clearly distinguish between:

USER-FACING FEATURES

and

OPERATOR/ADMIN/ANALYTICS FEATURES

Do not make the website confusing by presenting every technical component as a user feature.

==================================================
DESIGN REQUIREMENTS
==================================================

Keep the existing futuristic visual identity where appropriate:

- Dark theme
- Blue/cyan highlights
- Green operational status
- 3D/WebGL visualizations
- Glass/frosted panels
- Smooth animations
- Professional dashboard cards
- Responsive layout

But prioritize:

CLARITY > DECORATION

The user should immediately understand:

"What is this?"
"What can I do?"
"How do I use it?"
"How does it work?"

Avoid excessive buzzwords such as:

"Holographic"
"Quantum"
"Next-generation"
"Revolutionary"
"AI-powered"

unless they accurately describe an implemented feature.

==================================================
IMPORTANT TECHNICAL REQUIREMENTS
==================================================

Before changing the frontend:

1. Inspect the complete codebase.
2. Identify the actual frontend routes.
3. Identify backend APIs.
4. Identify actual ML models.
5. Identify actual datasets/data sources.
6. Identify actual database/storage.
7. Identify which features are functional and which are only visual placeholders.
8. Identify how real-time data is currently generated or received.
9. Identify the actual 3D implementation.
10. Identify all currently displayed hard-coded values.

Then produce a short audit:

CURRENT FEATURE
→ ACTUALLY IMPLEMENTED?
→ SOURCE FILE/API
→ KEEP / MODIFY / REMOVE

After that, update the frontend.

==================================================
VERY IMPORTANT
==================================================

Do not fabricate:

- bus numbers
- number of buses
- passenger counts
- routes
- locations
- ML accuracy
- model names
- datasets
- APIs
- live data
- statistics
- predictions

If the project currently uses simulated/demo data, explicitly label it as:

"Simulation Data"
or
"Demo Data"

Do not call simulated data "real-time" unless it is actually connected to a real-time source.

==================================================
FINAL RESULT
==================================================

The final website should feel like:

A professional intelligent bus-transit platform + an interactive project demonstration + a complete user guide.

A visitor should be able to understand the entire project without opening the source code.

The website should explain both:

1. HOW TO USE THE SYSTEM
2. HOW THE SYSTEM WAS BUILT

while keeping the 3D interactive transit experience as the main visual feature.