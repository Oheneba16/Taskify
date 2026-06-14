from rest_framework import serializers
from .models import Task, PRIORITY_CHOICES, STATUS_CHOICES


class TaskSerializer(serializers.ModelSerializer):
    dueDate = serializers.DateField(source='due_date', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    title = serializers.CharField(
        max_length=255,
        required=True,
        trim_whitespace=True,
        error_messages={
            'blank': 'Title cannot be empty.',
            'required': 'Title is required.',
            'max_length': 'Title cannot exceed 255 characters.',
        },
    )
    description = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.ChoiceField(
        choices=[choice[0] for choice in PRIORITY_CHOICES],
        required=True,
        error_messages={
            'invalid_choice': 'Priority must be Low, Medium, or High.',
            'required': 'Priority is required.',
            'blank': 'Priority is required.',
        },
    )
    status = serializers.ChoiceField(
        choices=[choice[0] for choice in STATUS_CHOICES],
        required=True,
        error_messages={
            'invalid_choice': 'Status must be Pending or Completed.',
            'required': 'Status is required.',
            'blank': 'Status is required.',
        },
    )

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'dueDate', 'priority', 'status', 'createdAt']
        read_only_fields = ['id', 'createdAt']

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Title cannot be empty.')
        return value

    def to_internal_value(self, data):
        mutable_data = data.copy()
        if 'due_date' in mutable_data and 'dueDate' not in mutable_data:
            value = mutable_data.pop('due_date')
            mutable_data['dueDate'] = value[0] if isinstance(value, list) else value
        return super().to_internal_value(mutable_data)
