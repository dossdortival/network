from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator

from .models import User, Post, Follow
import json


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def posts(request):
    posts = Post.objects.all().order_by("-created_at")
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Check if each post is liked by the current user
    for post in page_obj:
        if request.user.is_authenticated:
            post.is_liked = post.likes.filter(id=request.user.id).exists()
    
    return render(request, "network/posts.html", {
        "posts": page_obj
    })


def post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return HttpResponse("Post not found", status=404)
    
    if request.method == "GET":
        return JsonResponse(post.serialize())
    
    elif request.method == "PUT":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "You must be logged in to edit a post."}, status=403)
        if request.user != post.user:
            return JsonResponse({"error": "You can only edit your own posts."}, status=403)
        
        data = json.loads(request.body)
        post.content = data.get("content", post.content)
        post.save()
        return JsonResponse({"message": "Post updated successfully."}, status=200)
        
    elif request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "You must be logged in to like a post."}, status=403)

        action = request.POST.get("action")
        if action == "like":
            post.likes.add(request.user)
            post.is_liked = True
        elif action == "unlike":
            post.likes.remove(request.user)
            post.is_liked = False
        else:
            return JsonResponse({"error": "Invalid action."}, status=400)        
        return JsonResponse({"message": "Success", "likes": post.likes.count()}, status=200)

    else:
        return JsonResponse({"error": "Invalid request method."}, status=400)


def profile(request, username):
    user = User.objects.get(username=username)
    posts = Post.objects.filter(user=user).order_by("-created_at")
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    following_count = user.following.count()
    followers_count = user.followers.count()
    is_following = False
    if request.user.is_authenticated and request.user != user:
        is_following = Follow.objects.filter(follower=request.user, followed=user).exists()

    return render(request, "network/profile.html", {
        "profile_user": user,
        "posts": page_obj,
        "following_count": following_count,
        "followers_count": followers_count,
        "is_following": is_following
    })


def following(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("login"))
    
    following_users = User.objects.filter(followers__follower=request.user)
    posts = Post.objects.filter(user__in=following_users).order_by("-created_at")
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, "network/following.html", {
        "posts": page_obj
    })

def follow(request, username):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "You must be logged in to follow someone."}, status=403)
    
    try:
        user_to_follow = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    
    if request.user == user_to_follow:
        return JsonResponse({"error": "You cannot follow yourself."}, status=400)
    
    if request.method == "POST":
        action = request.POST.get("action")
        if action == "follow":
            Follow.objects.get_or_create(follower=request.user, followed=user_to_follow)
            return JsonResponse({"message": "Successfully followed.", "action": "unfollow"}, status=200)
        elif action == "unfollow":
            Follow.objects.filter(follower=request.user, followed=user_to_follow).delete()
            return JsonResponse({"message": "Successfully unfollowed.", "action": "follow"}, status=200)
        else:
            return JsonResponse({"error": "Invalid action."}, status=400)
    
    return JsonResponse({"error": "POST request required."}, status=400)