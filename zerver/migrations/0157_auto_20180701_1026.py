# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-07-01 02:26
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0156_auto_20180623_1147'),
    ]

    operations = [
        migrations.AlterField(
            model_name='backlog',
            name='task',
            field=models.CharField(max_length=70),
        ),
        migrations.AlterField(
            model_name='backlogaccessory',
            name='accessory_name',
            field=models.CharField(default='', max_length=60),
        ),
        migrations.AlterField(
            model_name='backlogaccessory',
            name='accessory_size',
            field=models.CharField(default='', max_length=40),
        ),
        migrations.AlterField(
            model_name='statementaccessory',
            name='accessory_name',
            field=models.CharField(default='', max_length=60),
        ),
        migrations.AlterField(
            model_name='statementaccessory',
            name='accessory_size',
            field=models.CharField(default='', max_length=40),
        ),
    ]
