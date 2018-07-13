# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-07-12 02:33
from __future__ import unicode_literals

import bitfield.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0159_auto_20180710_1920'),
    ]

    operations = [
        migrations.AlterField(
            model_name='archivedusermessage',
            name='flags',
            field=bitfield.models.BitField(['read', 'starred', 'collapsed', 'mentioned', 'wildcard_mentioned', 'summarize_in_home', 'summarize_in_stream', 'force_expand', 'force_collapse', 'has_alert_word', 'historical', 'management', 'supervise'], default=0),
        ),
        migrations.AlterField(
            model_name='usermessage',
            name='flags',
            field=bitfield.models.BitField(['read', 'starred', 'collapsed', 'mentioned', 'wildcard_mentioned', 'summarize_in_home', 'summarize_in_stream', 'force_expand', 'force_collapse', 'has_alert_word', 'historical', 'management', 'supervise'], default=0),
        ),
    ]
