from django.db import models
from django.core.exceptions import ValidationError

PRIORITY_CHOICES = [
    ('Low', 'Low'),
    ('Medium', 'Medium'),
    ('High', 'High'),
]

STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Completed', 'Completed'),
]


def validate_priority(value):
    if value not in dict(PRIORITY_CHOICES):
        raise ValidationError('Priority must be Low, Medium, or High.')


def validate_status(value):
    if value not in dict(STATUS_CHOICES):
        raise ValidationError('Status must be Pending or Completed.')


class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium', validators=[validate_priority])
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending', validators=[validate_status])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['due_date']),
        ]

    def clean(self):
        super().clean()
        self.title = (self.title or '').strip()
        if not self.title:
            raise ValidationError({'title': 'Title cannot be empty.'})

    def __str__(self):
        return self.title
