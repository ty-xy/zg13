# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-06-11 08:53
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0158_auto_20180611_1630'),
    ]

    operations = [
        migrations.AlterField(
            model_name='updatebacklog',
            name='backlog_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='zerver.Backlog'),
        ),
    ]
