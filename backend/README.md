# Leave Management - Backend (Express + MongoDB)
```
npm install
npm run dev     # http://localhost:5000
npm test        # API tests (server must be running)
```
Endpoints: POST /api/auth/register | /login, POST /api/leaves, GET /api/leaves/my, GET /api/leaves (manager), PATCH /api/leaves/:id (manager)
Deploy on Render / Railway; use MongoDB Atlas for MONGO_URI.
