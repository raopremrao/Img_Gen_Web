document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('promptInput');
    const generateBtn = document.getElementById('generateBtn');
    const generatedImage = document.getElementById('generatedImage');
    const statusMessage = document.getElementById('statusMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // --- IMPORTANT: REPLACE THIS WITH YOUR N8N WEBHOOK URL ---
    // Get this from your active N8n workflow's Webhook node.
    // It will look like: http://localhost:5678/webhook/generate-image
    const N8N_WEBHOOK_URL = 'https://primary-production-9b05.up.railway.app/webhook/generate-image'; 
    // --- END IMPORTANT ---

    generateBtn.addEventListener('click', generateImage);

    async function generateImage() {
        const promptText = promptInput.value.trim();

        if (!promptText) {
            showMessage('Please enter a description for the image.', 'error');
            return;
        }

        setLoading(true);
        hideImage();
        clearMessage();

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Sending JSON prompt to N8n
                },
                body: JSON.stringify({ promptText: promptText })
            });

            console.log('Response Status from N8n:', response.status);
            const contentTypeFromN8n = response.headers.get('Content-Type');
            console.log('Response Content-Type header from N8n:', contentTypeFromN8n);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error from N8n workflow:', errorText);
                throw new Error(`N8n workflow error (Status: ${response.status}): ${errorText.substring(0, 200)}...`);
            }

            // Check if N8n is sending back an image
            if (!contentTypeFromN8n || !contentTypeFromN8n.startsWith('image/')) {
                 console.error('N8n did not return an image. Received Content-Type:', contentTypeFromN8n);
                 const responseText = await response.text();
                 console.error('Response text from N8n:', responseText.substring(0, 500));
                 throw new Error(`Expected image from N8n, but received '${contentTypeFromN8n}'. Check N8n logs and 'Respond to Webhook' node.`);
            }

            const imageBlob = await response.blob();
            console.log('Image Blob Type (parsed by browser):', imageBlob.type);
            console.log('Image Blob Size:', imageBlob.size, 'bytes');

            if (imageBlob.size === 0) {
                console.error('Received an empty image blob from N8n!');
                showMessage('Received an empty image. Generation might have failed on AI side or N8n workflow issue.', 'error');
                setLoading(false);
                return;
            }

            const imageUrl = URL.createObjectURL(imageBlob);
            generatedImage.src = imageUrl;
            showImage();
            showMessage('Image generated successfully!', 'success');

        } catch (error) {
            console.error('Failed to generate image (Full Error):', error);
            showMessage(`Failed to generate image: ${error.message || 'An unknown error occurred.'}`, 'error');
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            statusMessage.classList.add('hidden'); // Hide previous status message
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }

    function showMessage(message, type) { // type can be 'success' or 'error'
        statusMessage.textContent = message;
        statusMessage.className = ''; // Clear existing classes
        statusMessage.classList.add('status-message', type); // Add base and specific type
        statusMessage.classList.remove('hidden');
    }

    function clearMessage() {
        statusMessage.textContent = '';
        statusMessage.classList.add('hidden');
        statusMessage.className = 'status-message'; // Reset to base class
    }

    function showImage() {
        generatedImage.classList.remove('hidden');
    }

    function hideImage() {
        generatedImage.classList.add('hidden');
        generatedImage.src = ''; // Clear previous image
    }
});