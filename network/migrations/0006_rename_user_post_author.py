# Generated by Django 5.2 on 2025-05-20 11:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0005_alter_post_options_user_following_delete_follow'),
    ]

    operations = [
        migrations.RenameField(
            model_name='post',
            old_name='user',
            new_name='author',
        ),
    ]
