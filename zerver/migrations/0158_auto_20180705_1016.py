# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-07-05 02:16
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0157_auto_20180701_1026'),
    ]

    operations = [
        migrations.AlterField(
            model_name='backlogaccessory',
            name='accessory_name',
            field=models.CharField(default='', max_length=120),
        ),
        migrations.AlterField(
            model_name='statementaccessory',
            name='accessory_name',
            field=models.CharField(default='', max_length=120),
        ),
    ]
