\# University Sports Facility Booking System



A web-based application for managing university sports facilities, scheduling time slots, and handling student bookings with role-based access control and database-level concurrency protection.



\## Features



\### Student

\- Register and log in securely.

\- Browse available sports facilities and time slots.

\- Filter slots by facility and date.

\- Book available slots.

\- View personal bookings.

\- Cancel confirmed bookings.



\### Administrator

\- Access the administrator dashboard.

\- View all bookings.

\- Filter bookings by status.

\- Monitor booking records across the system.



\### Backend and Database

\- RESTful API built with Node.js and Express.

\- PostgreSQL relational database.

\- Password hashing using bcrypt.

\- JWT-based authentication.

\- Role-based authorization for student and administrator accounts.

\- Parameterized SQL queries.

\- Database-level protection against duplicate confirmed bookings.



\## Technology Stack



| Component | Technology |

|---|---|

| Frontend | HTML, CSS, JavaScript |

| Backend | Node.js, Express.js |

| Database | PostgreSQL |

| Authentication | JSON Web Tokens (JWT) |

| Password Security | bcrypt |

| Testing | Node.js HTTP concurrency test |



\## Project Structure



```text

university-sports-booking/

├── backend/

│   ├── src/

│   │   ├── config/

│   │   ├── middleware/

│   │   ├── routes/

│   │   ├── server.js

│   │   └── test-db.js

│   ├── package.json

│   └── package-lock.json

├── database/

│   └── seed.sql

├── frontend/

│   ├── css/

│   ├── js/

│   ├── index.html

│   ├── register.html

│   ├── student.html

│   └── admin.html

└── tests/

&#x20;   └── concurrency-test.js

```



\## Requirements



\- Node.js

\- npm

\- PostgreSQL



\## Installation and Setup



\### 1. Clone the repository



```bash

git clone YOUR\_GITHUB\_REPOSITORY\_URL

cd university-sports-booking

```



\### 2. Create the database



Create a PostgreSQL database named:



```sql

CREATE DATABASE sports\_booking;

```



Run the database schema and seed SQL provided in `database/seed.sql`.



\### 3. Configure environment variables



Inside the `backend` directory, create a `.env` file:



```env

PORT=5000



DB\_HOST=localhost

DB\_PORT=5432

DB\_NAME=sports\_booking

DB\_USER=postgres

DB\_PASSWORD=YOUR\_POSTGRES\_PASSWORD



JWT\_SECRET=YOUR\_SECURE\_RANDOM\_SECRET

```



Do not commit `.env` or expose database credentials and JWT secrets.



\### 4. Install backend dependencies



```bash

cd backend

npm install

```



\### 5. Start the backend



```bash

npx nodemon src/server.js

```



The API runs at:



```text

http://localhost:5000

```



\### 6. Open the frontend



Open `frontend/index.html` in a browser, or serve the `frontend` directory using a local static web server.



\## API Endpoints



| Method | Endpoint | Description |

|---|---|---|

| POST | `/api/auth/register` | Register a user |

| POST | `/api/auth/login` | Authenticate a user |

| GET | `/api/facilities` | Retrieve facilities |

| POST | `/api/facilities` | Create a facility (admin) |

| GET | `/api/slots` | Retrieve slots |

| GET | `/api/slots?available=true` | Retrieve available slots |

| POST | `/api/slots` | Create a slot (admin) |

| POST | `/api/bookings` | Create a booking |

| GET | `/api/bookings/my` | Retrieve personal bookings |

| GET | `/api/bookings` | Retrieve all bookings (admin) |

| PATCH | `/api/bookings/:id/cancel` | Cancel an owned booking |



Protected endpoints require a valid JWT in the Authorization header:



```text

Authorization: Bearer YOUR\_TOKEN

```



\## Concurrency Control



The system prevents multiple users from confirming the same slot simultaneously.



A partial unique index is implemented in PostgreSQL:



```sql

CREATE UNIQUE INDEX unique\_confirmed\_booking\_per\_slot

ON bookings (slot\_id)

WHERE status = 'CONFIRMED';

```



This enforces the booking constraint at the database level, even when concurrent requests reach the backend at nearly the same time.



When a duplicate booking violates the constraint, the backend handles PostgreSQL error code `23505` and returns HTTP `409 Conflict`.



\### Concurrency Test



The test script sends 50 simultaneous booking requests for the same slot.



Run:



```bash

node tests/concurrency-test.js

```



\*\*Verified test result:\*\*



| Response | Requests |

|---|---:|

| 201 Created | 1 |

| 409 Conflict | 49 |

| 500+ Server Errors | 0 |

| Other | 0 |



Result: Exactly one booking succeeded, demonstrating that the database constraint prevents duplicate confirmed bookings under concurrent requests.



\## Security



\- Passwords are hashed before storage.

\- JWT authentication protects private endpoints.

\- Role-based middleware restricts administrator operations.

\- Students can only cancel their own bookings.

\- SQL queries use parameterized inputs.

\- Environment files and dependency directories are excluded through `.gitignore`.



\## Future Improvements



\- Automated unit and integration testing.

\- Improved booking history and reporting.

\- Email notifications for booking confirmation and cancellation.

\- Deployment to a production hosting environment.



\## Project Status



Core student booking, administrator management, authentication, database integration, and concurrency protection have been implemented and tested.



