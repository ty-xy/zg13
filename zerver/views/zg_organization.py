from django.http import JsonResponse
from zerver.models import Message
from django.db.models import Q


def zg_address_book(request,user_profile):
    Message.objects.filter(sender=user_profile,recipient=)


