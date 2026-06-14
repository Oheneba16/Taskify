from django.urls import reverse
from datetime import date
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Task


class TaskApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('task-list-create')

    def test_can_create_and_list_tasks(self):
        response = self.client.post(
            self.list_url,
            {
                'title': 'Plan the week',
                'description': 'Choose three high-value tasks.',
                'dueDate': '2026-06-20',
                'priority': 'High',
                'status': 'Pending',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Plan the week')
        self.assertEqual(response.data['dueDate'], '2026-06-20')

        list_response = self.client.get(self.list_url)

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)

    def test_rejects_invalid_payload(self):
        response = self.client.post(
            self.list_url,
            {
                'title': '   ',
                'description': '',
                'priority': 'Urgent',
                'status': 'Open',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)
        self.assertIn('priority', response.data)
        self.assertIn('status', response.data)

    def test_can_update_complete_and_delete_task(self):
        task = Task.objects.create(title='Draft report', priority='Medium', status='Pending')
        detail_url = reverse('task-detail', kwargs={'pk': task.pk})

        update_response = self.client.put(
            detail_url,
            {
                'title': 'Draft report v2',
                'description': 'Add metrics section.',
                'dueDate': None,
                'priority': 'Low',
                'status': 'Pending',
            },
            format='json',
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['title'], 'Draft report v2')

        complete_response = self.client.patch(detail_url, {'status': 'Completed'}, format='json')

        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data['status'], 'Completed')

        delete_response = self.client.delete(detail_url)

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(pk=task.pk).exists())

    def test_can_filter_search_and_sort(self):
        Task.objects.create(title='Call client', priority='High', status='Pending', due_date=date(2026, 6, 18))
        Task.objects.create(title='Archive receipts', priority='Low', status='Completed', due_date=date(2026, 6, 15))

        response = self.client.get(self.list_url, {'search': 'call', 'status': 'Pending', 'ordering': 'dueDate'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Call client')
