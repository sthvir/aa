// --- HOME PAGE INTERACTIVITY ---
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

// --- RESOURCE PAGE INTERACTIVITY (for all-resource.html) ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if the current page is all-resource.html
    if (document.getElementById('upload-section')) {
        const uploadForm = document.getElementById('upload-form');
        const uploaderDiv = document.getElementById('uploader-div');
        const message = document.getElementById('message');
        
        // Define the secret code (THIS IS NOT SECURE, FOR FRONT-END TEST ONLY)
        const SECRET_CODE = "9B-Teacher-2024"; 

        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const inputCode = document.getElementById('permissionCode').value.trim();

            if (inputCode === SECRET_CODE) {
                // Successful verification
                uploadForm.style.display = 'none'; // Hide the form
                uploaderDiv.style.display = 'block'; // Show the uploader
                message.style.display = 'none';
            } else {
                // Failed verification
                message.style.display = 'block';
                document.getElementById('permissionCode').value = ''; // Clear input
            }
        });
    }
});