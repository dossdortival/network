from django.db import models
from django.contrib.auth.models import AbstractUser 

class User(AbstractUser):
    following = models.ManyToManyField("self", symmetrical=False, related_name="followers", blank=True)

    def __str__(self):
        return f"{self.username}"
    
    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "following_count": self.following.count(),
            "followers_count": self.followers.count()
        }

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Post by {self.author.username} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    def serialize(self):
        return {
            "id": self.id,
            "author": self.author.username,
            "author_id": self.author.id,
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes_count": self.likes.count(),
            "liked_by_user": False  
        } 