# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-09-12 02:39
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0169_auto_20180906_1725'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='zgdepartment',
            name='realm',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='department',
        ),
        migrations.DeleteModel(
            name='ZgDepartment',
        ),
    ]
