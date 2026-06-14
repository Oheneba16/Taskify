const API_URL = 'http://127.0.0.1:8000/api/tasks/';
const PRIORITY_WEIGHT = { Low: 1, Medium: 2, High: 3 };
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'Completed'];

const state = {
    tasks: [],
    editingId: null,
};

const elements = {
    form: document.querySelector('#task-form'),
    formTitle: document.querySelector('#form-title'),
    title: document.querySelector('#title'),
    description: document.querySelector('#description'),
    dueDate: document.querySelector('#due_date'),
    priority: document.querySelector('#priority'),
    submitBtn: document.querySelector('#submit-btn'),
    cancelEdit: document.querySelector('#cancel-edit'),
    formError: document.querySelector('#form-error'),
    taskList: document.querySelector('#task-list'),
    taskCount: document.querySelector('#task-count'),
    search: document.querySelector('#search-input'),
    filterStatus: document.querySelector('#filter-status'),
    filterPriority: document.querySelector('#filter-priority'),
    sortTasks: document.querySelector('#sort-tasks'),
    themeToggle: document.querySelector('#toggle-theme'),
    metricTotal: document.querySelector('#metric-total'),
    metricPending: document.querySelector('#metric-pending'),
    metricCompleted: document.querySelector('#metric-completed'),
};

function formatDate(value) {
    if (!value) {
        return 'No due date';
    }

    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return 'Unknown';
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function showError(message) {
    elements.formError.textContent = message;
    elements.formError.classList.remove('hidden');
}

function clearError() {
    elements.formError.textContent = '';
    elements.formError.classList.add('hidden');
}

function getSelectedStatus() {
    return new FormData(elements.form).get('status');
}

function validateTaskPayload(payload) {
    if (!payload.title.trim()) {
        return 'Title cannot be empty.';
    }

    if (!VALID_PRIORITIES.includes(payload.priority)) {
        return 'Priority must be Low, Medium, or High.';
    }

    if (!VALID_STATUSES.includes(payload.status)) {
        return 'Status must be Pending or Completed.';
    }

    return '';
}

function buildTaskPayload() {
    return {
        title: elements.title.value.trim(),
        description: elements.description.value.trim(),
        dueDate: elements.dueDate.value || null,
        priority: elements.priority.value,
        status: getSelectedStatus(),
    };
}

async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (response.ok) {
        return data;
    }

    throw new Error(extractErrorMessage(data, response.status));
}

function extractErrorMessage(data, status) {
    if (!data) {
        return `Request failed with status ${status}.`;
    }

    if (typeof data.detail === 'string') {
        return data.detail;
    }

    const messages = Object.entries(data).flatMap(([field, value]) => {
        const text = Array.isArray(value) ? value.join(' ') : String(value);
        return `${field}: ${text}`;
    });

    return messages.join(' ') || `Request failed with status ${status}.`;
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    return parseResponse(response);
}

async function loadTasks() {
    elements.taskList.innerHTML = '<div class="loading-state">Loading tasks...</div>';

    try {
        const tasks = await apiRequest(API_URL);
        state.tasks = Array.isArray(tasks) ? tasks : tasks.results || [];
        renderTasks();
    } catch (error) {
        elements.taskList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
        updateMetrics([]);
    }
}

function getVisibleTasks() {
    const searchTerm = elements.search.value.trim().toLowerCase();
    const status = elements.filterStatus.value;
    const priority = elements.filterPriority.value;
    const sortBy = elements.sortTasks.value;

    return [...state.tasks]
        .filter((task) => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm);
            const matchesStatus = status === 'all' || task.status === status;
            const matchesPriority = priority === 'all' || task.priority === priority;
            return matchesSearch && matchesStatus && matchesPriority;
        })
        .sort((a, b) => sortTasks(a, b, sortBy));
}

function sortTasks(a, b, sortBy) {
    if (sortBy === 'createdAt-asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
    }

    if (sortBy === 'dueDate-asc') {
        return dueDateValue(a) - dueDateValue(b);
    }

    if (sortBy === 'dueDate-desc') {
        return dueDateValue(b) - dueDateValue(a);
    }

    if (sortBy === 'priority-desc') {
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    }

    if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
}

function dueDateValue(task) {
    return task.dueDate ? new Date(`${task.dueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
}

function renderTasks() {
    const visibleTasks = getVisibleTasks();
    updateMetrics(state.tasks);
    elements.taskCount.textContent = `${visibleTasks.length} of ${state.tasks.length} tasks shown`;

    if (!visibleTasks.length) {
        elements.taskList.innerHTML = '<div class="empty-state">No tasks found.</div>';
        return;
    }

    elements.taskList.innerHTML = visibleTasks.map(renderTaskCard).join('');
}

function updateMetrics(tasks) {
    const completed = tasks.filter((task) => task.status === 'Completed').length;
    const pending = tasks.filter((task) => task.status === 'Pending').length;

    elements.metricTotal.textContent = tasks.length;
    elements.metricPending.textContent = pending;
    elements.metricCompleted.textContent = completed;
}

function renderTaskCard(task) {
    const isCompleted = task.status === 'Completed';
    const nextStatus = isCompleted ? 'Pending' : 'Completed';
    const priorityClass = task.priority.toLowerCase();
    const statusClass = task.status.toLowerCase();

    return `
        <article class="task-card ${isCompleted ? 'completed' : ''}">
            <div class="task-title-row">
                <div class="task-main">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <p class="task-description">${escapeHtml(task.description || 'No description')}</p>
                </div>
                <span class="pill ${statusClass}">${escapeHtml(task.status)}</span>
            </div>
            <div class="task-meta">
                <span class="pill ${priorityClass}">${escapeHtml(task.priority)}</span>
                <span class="pill">Due ${escapeHtml(formatDate(task.dueDate))}</span>
                <span class="pill">Created ${escapeHtml(formatDateTime(task.createdAt))}</span>
            </div>
            <div class="task-actions">
                <button class="btn btn-secondary" type="button" data-action="toggle" data-id="${task.id}">
                    ${isCompleted ? 'Mark pending' : 'Mark complete'}
                </button>
                <button class="icon-button" type="button" data-action="edit" data-id="${task.id}" aria-label="Edit ${escapeHtml(task.title)}" title="Edit">
                    <span aria-hidden="true">Edit</span>
                </button>
                <button class="icon-button danger-button" type="button" data-action="delete" data-id="${task.id}" aria-label="Delete ${escapeHtml(task.title)}" title="Delete">
                    <span aria-hidden="true">Del</span>
                </button>
            </div>
        </article>
    `;
}

async function handleSubmit(event) {
    event.preventDefault();
    clearError();

    const payload = buildTaskPayload();
    const validationError = validateTaskPayload(payload);

    if (validationError) {
        showError(validationError);
        return;
    }

    elements.submitBtn.disabled = true;

    try {
        if (state.editingId) {
            await apiRequest(`${API_URL}${state.editingId}/`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        } else {
            await apiRequest(API_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        }

        resetForm();
        await loadTasks();
    } catch (error) {
        showError(error.message);
    } finally {
        elements.submitBtn.disabled = false;
    }
}

function resetForm() {
    state.editingId = null;
    elements.form.reset();
    elements.priority.value = 'Medium';
    document.querySelector('input[name="status"][value="Pending"]').checked = true;
    elements.formTitle.textContent = 'New task';
    elements.submitBtn.innerHTML = '<span aria-hidden="true">+</span> Save task';
    elements.cancelEdit.classList.add('hidden');
    clearError();
}

function fillEditForm(task) {
    state.editingId = task.id;
    elements.title.value = task.title;
    elements.description.value = task.description || '';
    elements.dueDate.value = task.dueDate || '';
    elements.priority.value = task.priority;
    document.querySelector(`input[name="status"][value="${task.status}"]`).checked = true;
    elements.formTitle.textContent = 'Edit task';
    elements.submitBtn.innerHTML = '<span aria-hidden="true">OK</span> Update task';
    elements.cancelEdit.classList.remove('hidden');
    elements.title.focus();
    clearError();
}

async function handleTaskAction(event) {
    const button = event.target.closest('button[data-action]');

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);
    const task = state.tasks.find((item) => item.id === id);

    if (!task) {
        return;
    }

    const action = button.dataset.action;

    if (action === 'edit') {
        fillEditForm(task);
    }

    if (action === 'toggle') {
        await toggleTaskStatus(task);
    }

    if (action === 'delete') {
        await deleteTask(task);
    }
}

async function toggleTaskStatus(task) {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';

    try {
        await apiRequest(`${API_URL}${task.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus }),
        });
        await loadTasks();
    } catch (error) {
        showError(error.message);
    }
}

async function deleteTask(task) {
    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API_URL}${task.id}/`, { method: 'DELETE' });
        if (state.editingId === task.id) {
            resetForm();
        }
        await loadTasks();
    } catch (error) {
        showError(error.message);
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function applyTheme() {
    const theme = localStorage.getItem('taskify-theme') || 'light';
    document.body.classList.toggle('dark', theme === 'dark');
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('taskify-theme', isDark ? 'dark' : 'light');
}

elements.form.addEventListener('submit', handleSubmit);
elements.cancelEdit.addEventListener('click', resetForm);
elements.taskList.addEventListener('click', handleTaskAction);
elements.search.addEventListener('input', renderTasks);
elements.filterStatus.addEventListener('change', renderTasks);
elements.filterPriority.addEventListener('change', renderTasks);
elements.sortTasks.addEventListener('change', renderTasks);
elements.themeToggle.addEventListener('click', toggleTheme);

applyTheme();
loadTasks();
