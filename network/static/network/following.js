document.addEventListener('DOMContentLoaded', function() {
    // Load the network.js script
    const commonScript = document.createElement('script');
    commonScript.src = '/static/network/network.js';
    document.head.appendChild(commonScript);
    
    // Wait for the common script to load
    commonScript.onload = function() {
        // Load following posts
        loadFollowingPosts(1);
    };
});

// Get the current logged-in username from the navbar
function getCurrentUsername() {
    const userLink = document.querySelector('.navbar-nav strong');
    return userLink ? userLink.textContent : null;
}

// Load posts from users the current user follows
async function loadFollowingPosts(page = 1) {
    try {
        const response = await fetch(`/following/${page}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayPosts(data.posts);
            
            // Set up pagination
            setupPagination(data.page, data.has_next, data.has_previous, loadFollowingPosts);
        } else {
            console.error('Failed to load following posts');
        }
    } catch (error) {
        console.error('Error loading following posts:', error);
    }
}

// Display posts in the container
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '';
    
    const currentUser = getCurrentUsername();
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="text-center mt-4">No posts to display. Follow some users to see their posts here!</p>';
        return;
    }
    
    // Create and append post cards
    posts.forEach(post => {
        const postCard = createPostCard(post, currentUser);
        postsContainer.appendChild(postCard);
    });
}