document.addEventListener('DOMContentLoaded', function() {
    // Load the network.js script
    const commonScript = document.createElement('script');
    commonScript.src = '/static/network/network.js';
    document.head.appendChild(commonScript);
    
    // Wait for the common script to load
    commonScript.onload = function() {
        // Get username from the page
        const profileUsername = document.querySelector('h2.card-title').textContent;
        
        // Load profile data and posts
        loadProfile(profileUsername, 1);
        
        // Set up follow button if it exists
        const followButton = document.getElementById('follow-button');
        if (followButton) {
            followButton.addEventListener('click', () => toggleFollow(profileUsername));
        }
    };
});

// Get the current logged-in username from the navbar
function getCurrentUsername() {
    const userLink = document.querySelector('.navbar-nav strong');
    return userLink ? userLink.textContent : null;
}

// Load profile data and posts
async function loadProfile(username, page = 1) {
    try {
        const response = await fetch(`/profile/${username}/${page}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update profile information
            document.getElementById('followers-count').textContent = data.user.followers_count;
            document.getElementById('following-count').textContent = data.user.following_count;
            
            // Update follow button text if the user is logged in
            const followButton = document.getElementById('follow-button');
            if (followButton) {
                followButton.textContent = data.is_following ? 'Unfollow' : 'Follow';
                followButton.classList.toggle('btn-primary', data.is_following);
                followButton.classList.toggle('btn-outline-primary', !data.is_following);
            }
            
            // Display user's posts
            displayPosts(data.posts);
            
            // Set up pagination
            setupPagination(data.page, data.has_next, data.has_previous, 
                (newPage) => loadProfile(username, newPage));
        } else {
            console.error('Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
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

// Toggle follow/unfollow a user
async function toggleFollow(username) {
    try {
        const response = await fetch(`/profile/${username}/follow`, {
            method: 'PUT',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update the follow button
            const followButton = document.getElementById('follow-button');
            followButton.textContent = data.following ? 'Unfollow' : 'Follow';
            followButton.classList.toggle('btn-primary', data.following);
            followButton.classList.toggle('btn-outline-primary', !data.following);
            
            // Update the followers count
            document.getElementById('followers-count').textContent = data.followers_count;
        } else {
            console.error('Failed to update follow status');
        }
    } catch (error) {
        console.error('Error updating follow status:', error);
    }
}