document.addEventListener('DOMContentLoaded', function() {
    // Load the network.js script
    const commonScript = document.createElement('script');
    commonScript.src = '/static/network/network.js';
    document.head.appendChild(commonScript);
    
    // Wait for the common script to load
    commonScript.onload = function() {
        // Load posts when page loads
        loadPosts(1);
        
        // Set up new post form if the user is logged in
        const submitPostButton = document.getElementById('submit-post');
        if (submitPostButton) {
            submitPostButton.addEventListener('click', createNewPost);
        }
    };
});

// Get the current logged-in username from the navbar
function getCurrentUsername() {
    const userLink = document.querySelector('.navbar-nav strong');
    return userLink ? userLink.textContent : null;
}

// Load posts with pagination
async function loadPosts(page = 1) {
    try {
        const response = await fetch(`/posts/${page}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayPosts(data.posts);
            
            // Set up pagination
            setupPagination(data.page, data.has_next, data.has_previous, loadPosts);
        } else {
            console.error('Failed to load posts');
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Display posts in the container
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '';
    
    const currentUser = getCurrentUsername();
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="text-center mt-4">No posts to display.</p>';
        return;
    }
    
    // Create and append post cards
    posts.forEach(post => {
        const postCard = createPostCard(post, currentUser);
        postsContainer.appendChild(postCard);
    });
}

// Create a new post
async function createNewPost() {
    const contentField = document.getElementById('post-content');
    const content = contentField.value.trim();
    
    if (!content) {
        alert('Post content cannot be empty.');
        return;
    }
    
    try {
        const response = await fetch('/posts/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                content: content
            })
        });
        
        if (response.ok) {
            // Clear the form
            contentField.value = '';
            
            // Reload the first page of posts
            loadPosts(1);
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    }
}