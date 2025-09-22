# Generated manually on 2025-09-22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contracts', '0010_savedcontract_initial_contracts_at_group_add_and_more'),
    ]

    operations = [
        # Remove the old fields
        migrations.RemoveField(
            model_name='savedcontract',
            name='initial_equity_at_group_add',
        ),
        migrations.RemoveField(
            model_name='savedcontract',
            name='initial_contracts_at_group_add',
        ),
        migrations.RemoveField(
            model_name='savedcontract',
            name='initial_underlying_at_group_add',
        ),
        # Add the new fields
        migrations.AddField(
            model_name='savedcontract',
            name='initial_premium',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='savedcontract',
            name='current_premium',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='savedcontract',
            name='initial_equity',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='savedcontract',
            name='current_equity',
            field=models.FloatField(blank=True, null=True),
        ),
    ]