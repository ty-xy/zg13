# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-10-10 02:05
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0175_zgattendance_create_time'),
    ]

    operations = [
        migrations.AlterField(
            model_name='realm',
            name='invite_required',
            field=models.BooleanField(default=False),
        ),
    ]
