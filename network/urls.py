
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API routes
    path("posts", views.posts, name="posts"),
    path("posts/<int:page>", views.posts, name="posts_page"),
    path("posts/new", views.new_post, name="new_post"),
    path("posts/<int:post_id>/edit", views.edit_post, name="edit_post"),
    path("posts/<int:post_id>/like", views.like_post, name="like_post"),

    # User profile and following
    path("profile/<str:username>", views.profile, name="profile"),
    path("profile/<str:username>/<int:page>", views.profile, name="profile_page"),
    path("profile/<str:username>/follow", views.follow, name="follow"),
    path("following", views.following_posts, name="following"),
    path("following/<int:page>", views.following_posts, name="following_page"),       
]
