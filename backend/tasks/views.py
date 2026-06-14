from rest_framework import generics
from rest_framework.exceptions import ValidationError
from .models import Task
from .serializers import TaskSerializer


VALID_PRIORITIES = {'Low', 'Medium', 'High'}
VALID_STATUSES = {'Pending', 'Completed'}
ORDERING_FIELDS = {
    'createdAt': 'created_at',
    '-createdAt': '-created_at',
    'dueDate': 'due_date',
    '-dueDate': '-due_date',
    'title': 'title',
    '-title': '-title',
    'priority': 'priority',
    '-priority': '-priority',
    'status': 'status',
    '-status': '-status',
}


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.all()
        search = self.request.query_params.get('search', '').strip()
        status = self.request.query_params.get('status', '').strip()
        priority = self.request.query_params.get('priority', '').strip()
        ordering = self.request.query_params.get('ordering', '-createdAt').strip()

        if search:
            queryset = queryset.filter(title__icontains=search)

        if status and status != 'all':
            if status not in VALID_STATUSES:
                raise ValidationError({'status': 'Status filter must be Pending or Completed.'})
            queryset = queryset.filter(status=status)

        if priority and priority != 'all':
            if priority not in VALID_PRIORITIES:
                raise ValidationError({'priority': 'Priority filter must be Low, Medium, or High.'})
            queryset = queryset.filter(priority=priority)

        return queryset.order_by(ORDERING_FIELDS.get(ordering, '-created_at'))


class TaskRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
