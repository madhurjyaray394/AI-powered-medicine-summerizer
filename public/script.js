document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('medicineImage');
    const fileLabel = document.getElementById('fileLabel');
    const uploadForm = document.getElementById('uploadForm');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const submitBtn = document.getElementById('submitBtn');

    let currentPreviewUrl = null;

    // Display selected file name and preview the image
    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            fileLabel.textContent = file.name;

            // Free up memory from previous image preview
            if (currentPreviewUrl) {
                URL.revokeObjectURL(currentPreviewUrl);
            }

            // Create a memory-efficient preview URL (doesn't load entire file to RAM as base64)
            currentPreviewUrl = URL.createObjectURL(file);
            imagePreview.src = currentPreviewUrl;

            imagePreviewContainer.style.display = 'block';
        } else {
            fileLabel.textContent = 'Choose an image';
            imagePreview.src = ''; // Clear image reference
            imagePreviewContainer.style.display = 'none';
        }
    });

    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page from refreshing

        const file = fileInput.files[0];
        if (!file) {
            alert('Please select an image first.');
            return;
        }

        // Update UI to show loading/compressing state
        loading.style.display = 'block';
        document.querySelector('.loading-text').textContent = "Compressing & analyzing image... Please wait.";
        resultsSection.style.display = 'none';
        submitBtn.disabled = true;

        try {
            // We skip client-side compression entirely and upload the raw file to the backend
            // because loading 10MB+ live camera photos into an HTML Canvas or Image element 
            // frequently causes "Out of Memory" crashes on iOS Safari and Android Chrome.
            const formData = new FormData();
            formData.append('medicineImage', file, file.name);
            // Send the image to our local Node.js backend
            const response = await fetch('/api/scan', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Update UI with results
                document.getElementById('rawOcrText').textContent = data.extractedText || 'No text found';
                document.getElementById('medicineName').textContent = data.medicineName || 'Could not identify name';
                document.getElementById('medicineUsage').textContent = data.usage || 'Information not available';
                document.getElementById('medicineWarnings').textContent = data.warnings || 'Information not available';

                // Show results section
                resultsSection.style.display = 'block';
            } else {
                throw new Error(data.error || 'Failed to process image');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        } finally {
            // Reset loading state
            loading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
});
