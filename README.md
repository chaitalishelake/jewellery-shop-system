# Jewellery Shop Management System

A beginner-friendly full-stack project using the supplied MAISON D'OR frontend, a Java Spring Boot backend, and MySQL.

## Important architecture note

The uploaded UI is a **web frontend** built with HTML, CSS and JavaScript. It is not a Java Swing interface. To preserve the UI you supplied, this project uses:

- Frontend: HTML, CSS, JavaScript (your supplied design)
- Backend: Java 21 + Spring Boot REST API
- Database: MySQL 8
- Database access: Spring JDBC
- Browser-to-backend communication: HTTP JSON API

If your college specifically requires Java Swing, this supplied web UI would need to be redesigned as Swing screens. This project instead preserves your current UI.

## Features

- Jewellery inventory catalogue and valuation
- Product search, filtering and inventory updates
- Billing/POS cart and invoice calculations
- Customer registry
- Old-gold appraisal calculator
- Custom workshop orders
- Sales and reports dashboard
- Theme and shop settings
- MySQL persistence for the app's complete state

The original frontend has been retained. Its browser cache remains enabled for responsiveness, and each saved change is also sent to the Java backend and stored in MySQL.

## Requirements

Install these before running:

1. JDK 21 (or newer compatible JDK)
2. VS Code
3. VS Code **Extension Pack for Java** (Microsoft)
4. Apache Maven 3.9+
5. MySQL Server 8+ and MySQL Workbench

## Setup

### 1. Extract and open

Extract the ZIP file. In VS Code, choose **File → Open Folder** and open the `JewelleryShopManagementSystem` folder (the folder containing `pom.xml`).

### 2. Create the MySQL database

Open MySQL Workbench, connect to your local MySQL server, open `database/setup.sql`, and execute it.

This creates the `jewellery_shop_db` database and the `app_state` table.

### 3. Set your MySQL password

Open:

`src/main/resources/application.properties`

Change:

`spring.datasource.password=YOUR_MYSQL_PASSWORD`

to the password you use for the MySQL `root` account.

If your MySQL username is not `root`, change `spring.datasource.username` too.

### 4. Start the Java backend

Open the VS Code terminal (**Terminal → New Terminal**) in the project folder and run:

```bash
mvn spring-boot:run
```

Wait until the terminal says that the application has started. Keep this terminal open while using the project.

### 5. Open the application

Open this address in Chrome or Edge:

http://localhost:8080

Do **not** double-click `index.html`; use the localhost address so the frontend can communicate with the Java backend.

## Useful API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend |
| GET | `/api/state` | Load saved shop data |
| PUT | `/api/state` | Save shop data to MySQL |

You can test the health endpoint at http://localhost:8080/api/health.

## How the data is stored

The frontend maintains its current state in the browser for a responsive user experience. On each save, it sends the state as JSON to `PUT /api/state`. Java stores that JSON in the MySQL `app_state` table. On the next launch, the frontend requests `GET /api/state` and loads the saved state before rendering the UI.

This keeps the first full-stack version intentionally small and easy to explain. A future version can normalize products, customers, sales and order records into separate relational tables.

## Troubleshooting

- **`mvn` is not recognized:** Install Apache Maven and add its `bin` directory to Windows PATH, then restart VS Code.
- **Access denied for user:** Check the MySQL username and password in `application.properties`.
- **Unknown database:** Run `database/setup.sql` in MySQL Workbench.
- **Port 8080 already in use:** Close the other app using port 8080 or change `server.port` in `application.properties`.
- **Frontend says backend unavailable:** Confirm the Java app is running and open `http://localhost:8080`, not the HTML file directly.

## Demo data and important limitations

The supplied frontend includes sample jewellery, client, sales and metal-rate data. Replace the shop address, phone, tax details and sample records with your own demonstration details before presenting. Metal prices are sample values and are not connected to a live market feed. Verify applicable GST and invoicing rules before using this for real business transactions.

This is an educational project, not production-ready point-of-sale software. It currently stores the application state as one JSON document in MySQL; authentication, user roles, audit logs, backups and normalized transaction tables can be added as future improvements.
