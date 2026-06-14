# Taskify

Taskify is a full-stack task management app built with Django, Django REST Framework, SQLite, and a responsive HTML/CSS/JavaScript frontend. It supports creating, viewing, updating, deleting, searching, filtering, sorting, and completing daily tasks.

## Project Structure

```text
Taskify/
  backend/
    manage.py
    requirements.txt
    taskify/
      settings.py
      urls.py
    tasks/
      models.py
      serializers.py
      views.py
      urls.py
      tests.py
      fixtures/sample_tasks.json
  frontend/
    index.html
    styles.css
    app.js
```

## Backend Setup

From the `Taskify` folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
cd backend
python manage.py migrate
python manage.py loaddata sample_tasks
python manage.py runserver
```

Open `http://127.0.0.1:8000/` in your browser.

The frontend is served by Django and uses `/static/` for CSS and JavaScript assets.

## API Endpoints

```text
GET    /tasks/        Retrieve all tasks
GET    /tasks/:id/    Retrieve a specific task
POST   /tasks/        Create a task
PUT    /tasks/:id/    Update a task
PATCH  /tasks/:id/    Update part of a task, such as status
DELETE /tasks/:id/    Delete a task
```

The same endpoints are also available under `/api/tasks/`.

## Task JSON Shape

```json
{
  "id": 1,
  "title": "Plan Monday priorities",
  "description": "Choose the top three outcomes for the day.",
  "dueDate": "2026-06-15",
  "priority": "High",
  "status": "Pending",
  "createdAt": "2026-06-14T09:00:00Z"
}
```

## Validation

The backend and frontend both enforce:

- `title` is required and cannot be empty.
- `priority` must be `Low`, `Medium`, or `High`.
- `status` must be `Pending` or `Completed`.

Invalid API requests return `400 Bad Request` with field-level error messages.

## Useful API Filters

```text
GET /tasks/?search=report
GET /tasks/?status=Pending
GET /tasks/?priority=High
GET /tasks/?ordering=dueDate
GET /tasks/?ordering=-createdAt
```

## Tests

From `Taskify/backend` with the virtual environment active:

```powershell
python manage.py test
```

## Production Notes

Use environment variables before deployment:

```text
DJANGO_SECRET_KEY
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com
DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

SQLite is configured for development. For PostgreSQL, install a PostgreSQL driver and update `DATABASES` in `backend/taskify/settings.py` or load database values from environment variables.
