from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_alter_attendance_attendance_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='users',
            name='salary',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
    ]
