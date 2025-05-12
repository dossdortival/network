from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator

from .models import User, Post
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
    posts = Post.objects.all().order_by("-timestamp")
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
