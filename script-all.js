// --- HOME PAGE INTERACTIVITY (Smooth Scroll) ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        // Smooth scroll implementation
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
        
        // Close the navbar collapse on mobile after clicking a link
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            new bootstrap.Collapse(navbarCollapse, { toggle: false }).hide();
        }
    });
});

// --- RESOURCE PAGE INTERACTIVITY (New Backend Logic) ---
document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: Change to your deployed server URL later
    const API_URL = 'http://localhost:3000/api'; 
    const UPLOAD_SECRET = "9B-Teacher-2024"; 

    const availableResourcesDiv = document.getElementById('available-resources');
    const loadingMessage = document.getElementById('loading-message');

    // --- 1. FETCH AND RENDER RESOURCES ---
    async function fetchAndRenderResources() {
        if (!availableResourcesDiv) return; 
        
        loadingMessage.innerText = 'Loading resources...';
        availableResourcesDiv.innerHTML = ''; 

        try {
            const response = await fetch(`${API_URL}/resources`);
            const data = await response.json();

            if (data.success && data.resources.length > 0) {
                loadingMessage.style.display = 'none';

                data.resources.forEach(resource => {
                    const resourceBox = createResourceBox(resource);
                    availableResourcesDiv.appendChild(resourceBox);
                });
            } else {
                loadingMessage.innerText = 'No resources available yet.';
            }

        } catch (error) {
            loadingMessage.innerText = 'Error loading resources. Check if the server is running.';
            console.error('Fetch error:', error);
        }
    }

    // Creates the HTML structure for one resource box
    function createResourceBox(resource) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6';

        const date = new Date(resource.uploadDate).toLocaleDateString();
        const fileExtension = resource.filename.split('.').pop().toUpperCase();
        
        // Dynamically includes the Delete button (hidden until authenticated)
        col.innerHTML = `
            <div class="card note-card p-3 shadow">
                <h5 class="card-title">${resource.title}</h5>
                <p class="card-text mb-2">Uploaded: ${date} (${fileExtension} File)</p>
                
                <div class="d-flex justify-content-between">
                    <a href="${API_URL.replace('/api', '')}/uploads/${resource.filename}" 
                       target="_blank" class="btn btn-sm btn-custom-primary me-2">
                        <i class="fas fa-download me-2"></i> View / Get
                    </a>
                    
                    <button class="btn btn-sm btn-danger delete-btn" 
                            data-id="${resource._id}" 
                            data-title="${resource.title}"
                            style="display:none;"> 
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `;
        return col;
    }

    // --- 2. UPLOAD & DELETE LOGIC ---
    if (document.getElementById('upload-auth-form')) {
        const authForm = document.getElementById('upload-auth-form');
        const fileUploadForm = document.getElementById('file-upload-form');
        const uploaderDiv = document.getElementById('uploader-div');
        const authMessage = document.getElementById('auth-message');
        const uploadStatus = document.getElementById('upload-status');

        // Authentication Check
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const inputCode = document.getElementById('permissionCode').value.trim();
            if (inputCode === UPLOAD_SECRET) {
                authForm.style.display = 'none';
                uploaderDiv.style.display = 'block';
                authMessage.style.display = 'none';
                
                // Show delete buttons after successful authentication
                document.querySelectorAll('.delete-btn').forEach(btn => btn.style.display = 'block');

            } else {
                authMessage.style.display = 'block';
                document.getElementById('permissionCode').value = '';
            }
        });

        // File Upload Handler
        fileUploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            uploadStatus.className = 'text-warning mt-3';
            uploadStatus.innerText = 'Uploading...';

            const formData = new FormData(this); 

            try {
                const response = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        // Pass the secret code securely in the header
                        'X-Upload-Code': UPLOAD_SECRET 
                    }
                });

                const data = await response.json();
                if (data.success) {
                    uploadStatus.className = 'text-success mt-3';
                    uploadStatus.innerText = data.message;
                    fileUploadForm.reset(); 
                    fetchAndRenderResources(); 
                } else {
                    uploadStatus.className = 'text-danger mt-3';
                    uploadStatus.innerText = data.message;
                }
            } catch (error) {
                uploadStatus.className = 'text-danger mt-3';
                uploadStatus.innerText = 'Server error during upload.';
            }
        });
        
        // Delete Handler
        availableResourcesDiv.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
                const resourceId = btn.dataset.id;
                const resourceTitle = btn.dataset.title;

                if (!confirm(`Are you sure you want to permanently delete the resource: "${resourceTitle}"?`)) {
                    return;
                }
                
                try {
                    const response = await fetch(`${API_URL}/resource/${resourceId}`, {
                        method: 'DELETE',
                        headers: {
                            'X-Upload-Code': UPLOAD_SECRET 
                        }
                    });

                    const data = await response.json();
                    if (data.success) {
                        alert(data.message);
                        fetchAndRenderResources(); 
                    } else {
                        alert(`Deletion failed: ${data.message}`);
                    }
                } catch (error) {
                    alert('Error communicating with the server during deletion.');
                }
            }
        });
    }

    // Initial load of resources
    fetchAndRenderResources();
});