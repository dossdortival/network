// Utility function to create a post card element
function createPostCard(post, currentUser) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.dataset.postId = post.id;
    
    // Create card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Create post header with author link
    const author = document.createElement('h5');
    author.className = 'card-title';
    const authorLink = document.createElement('a');
    authorLink.href = `/profile/${post.author}`;
    authorLink.textContent = post.author;
    author.appendChild(authorLink);
    
    // Create post content
    const content = document.createElement('p');
    content.className = 'card-text post-content';
    content.textContent = post.content;
    
    // Create post timestamp
    const timestamp = document.createElement('small');
    timestamp.className = 'text-muted';
    timestamp.textContent = post.timestamp;
    
    // Create likes section
    const likesContainer = document.createElement('div');
    likesContainer.className = 'mt-2';
    
    const likesCount = document.createElement('span');
    likesCount.className = 'mr-2 likes-count';
    likesCount.textContent = `${post.likes_count} like${post.likes_count !== 1 ? 's' : ''}`;
    
    likesContainer.appendChild(likesCount);
    
    // Only add like button if user is logged in
    if (currentUser) {
        const likeButton = document.createElement('button');
        likeButton.className = 'btn btn-sm like-button';
        likeButton.textContent = post.liked_by_user ? 'Unlike' : 'Like';
        likeButton.classList.add(post.liked_by_user ? 'btn-primary' : 'btn-outline-primary');
        
        likeButton.addEventListener('click', () => toggleLike(post.id, likeButton, likesCount));
        
        likesContainer.appendChild(likeButton);
    }
    
    // Add edit button if the current user is the author
    if (currentUser === post.author) {
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-outline-secondary ml-2 edit-button';
        editButton.textContent = 'Edit';
        
        editButton.addEventListener('click', () => {
            // Toggle edit mode
            toggleEditMode(card, post.content);
        });
        
        likesContainer.appendChild(editButton);
    }
    
    // Append elements to card body
    cardBody.appendChild(author);
    cardBody.appendChild(content);
    cardBody.appendChild(timestamp);
    cardBody.appendChild(document.createElement('hr'));
    cardBody.appendChild(likesContainer);
    
    // Append card body to card
    card.appendChild(cardBody);
    
    return card;
}

// Toggle like/unlike a post
async function toggleLike(postId, likeButton, likesCount) {
    try {
        const response = await fetch(`/posts/${postId}/like`, {
            method: 'PUT',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update the like button
            if (data.liked) {
                likeButton.textContent = 'Unlike';
                likeButton.classList.remove('btn-outline-primary');
                likeButton.classList.add('btn-primary');
            } else {
                likeButton.textContent = 'Like';
                likeButton.classList.remove('btn-primary');
                likeButton.classList.add('btn-outline-primary');
            }
            
            // Update the likes count
            likesCount.textContent = `${data.likes_count} like${data.likes_count !== 1 ? 's' : ''}`;
        } else {
            console.error('Failed to update like');
        }
    } catch (error) {
        console.error('Error updating like:', error);
    }
}

// Toggle edit mode for a post
function toggleEditMode(postCard, currentContent) {
    const postId = postCard.dataset.postId;
    const contentElement = postCard.querySelector('.post-content');
    const editButton = postCard.querySelector('.edit-button');
    
    // If already in edit mode, cancel edit
    if (contentElement.getAttribute('contenteditable') === 'true') {
        contentElement.setAttribute('contenteditable', 'false');
        contentElement.textContent = currentContent;
        editButton.textContent = 'Edit';
        
        // Remove save button if it exists
        const saveButton = postCard.querySelector('.save-button');
        if (saveButton) {
            saveButton.remove();
        }
    } else {
        // Enter edit mode
        contentElement.setAttribute('contenteditable', 'true');
        contentElement.focus();
        editButton.textContent = 'Cancel';
        
        // Create save button
        const saveButton = document.createElement('button');
        saveButton.className = 'btn btn-sm btn-success ml-2 save-button';
        saveButton.textContent = 'Save';
        
        saveButton.addEventListener('click', () => {
            saveEditedPost(postId, contentElement.textContent, postCard);
        });
        
        // Add save button after edit button
        editButton.parentNode.insertBefore(saveButton, editButton.nextSibling);
    }
}

// Save edited post
async function saveEditedPost(postId, newContent, postCard) {
    try {
        const response = await fetch(`/posts/${postId}/edit`, {
            method: 'PUT',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: newContent
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update the post content
            const contentElement = postCard.querySelector('.post-content');
            contentElement.textContent = data.post.content;
            contentElement.setAttribute('contenteditable', 'false');
            
            // Restore edit button
            const editButton = postCard.querySelector('.edit-button');
            editButton.textContent = 'Edit';
            
            // Remove save button
            const saveButton = postCard.querySelector('.save-button');
            if (saveButton) {
                saveButton.remove();
            }
        } else {
            console.error('Failed to update post');
        }
    } catch (error) {
        console.error('Error updating post:', error);
    }
}

// Set up pagination controls
function setupPagination(currentPage, hasNext, hasPrevious, loadPostsFn) {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const currentPageElement = document.getElementById('current-page');
    
    currentPageElement.textContent = currentPage;
    
    if (hasPrevious) {
        prevButton.style.display = 'inline-block';
        prevButton.onclick = () => loadPostsFn(currentPage - 1);
    } else {
        prevButton.style.display = 'none';
    }
    
    if (hasNext) {
        nextButton.style.display = 'inline-block';
        nextButton.onclick = () => loadPostsFn(currentPage + 1);
    } else {
        nextButton.style.display = 'none';
    }
}