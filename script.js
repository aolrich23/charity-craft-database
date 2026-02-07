document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('projectGrid');
    const searchInput = document.getElementById('search');
    const materialSelect = document.getElementById('materialFilter');
    const timeSelect = document.getElementById('timeFilter');
    const recipientSelect = document.getElementById('recipientFilter');
    const noResultsMsg = document.getElementById('noResults');

    let projects = [];

    // 1. Fetch Data
    fetch('./data.json')
        .then(response => response.json())
        .then(data => {
            projects = data;
            populateDropdowns(data);
            renderProjects(projects);
        })
        .catch(error => console.error('Error loading data:', error));

    // 2. Populate Dynamic Dropdowns (Material & Recipient)
    function populateDropdowns(data) {
        // Get unique materials
        const materials = [...new Set(data.map(item => item.materialType))].sort();
        materials.forEach(mat => {
            const option = document.createElement('option');
            option.value = mat;
            option.textContent = mat;
            materialSelect.appendChild(option);
        });

        // Get unique recipients
        const recipients = [...new Set(data.map(item => item.recipient))].sort();
        recipients.forEach(rec => {
            const option = document.createElement('option');
            option.value = rec;
            option.textContent = rec;
            recipientSelect.appendChild(option);
        });
    }

    // 3. Render Cards
    function renderProjects(data) {
        grid.innerHTML = '';
        
        if (data.length === 0) {
            noResultsMsg.classList.remove('hidden');
            return;
        } else {
            noResultsMsg.classList.add('hidden');
        }

        data.forEach(project => {
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <h3>${project.title}</h3>
                <div class="card-meta">
                    <span><strong>Material:</strong> <span class="tag">${project.materialType}</span></span>
                    <span><strong>Time:</strong> ${project.estimatedTime}</span>
                    <span><strong>For:</strong> ${project.recipient}</span>
                </div>
                <p>${project.description}</p>
            `;
            grid.appendChild(card);
        });
    }

    // 4. Filter Logic
    function filterProjects() {
        const searchTerm = searchInput.value.toLowerCase();
        const materialValue = materialSelect.value;
        const timeValue = timeSelect.value;
        const recipientValue = recipientSelect.value;

        const filtered = projects.filter(project => {
            // Search Text (Title or Description)
            const matchesSearch = project.title.toLowerCase().includes(searchTerm) || 
                                  project.description.toLowerCase().includes(searchTerm);

            // Material Filter
            const matchesMaterial = materialValue === '' || project.materialType === materialValue;

            // Recipient Filter
            const matchesRecipient = recipientValue === '' || project.recipient === recipientValue;

            // Time Filter (Parsing logic)
            // Assumes format "X hours" or similar. 
            const hours = parseInt(project.estimatedTime); 
            let matchesTime = true;
            if (timeValue === 'short') matchesTime = hours < 3;
            else if (timeValue === 'medium') matchesTime = hours >= 3 && hours <= 10;
            else if (timeValue === 'long') matchesTime = hours > 10;

            return matchesSearch && matchesMaterial && matchesRecipient && matchesTime;
        });

        renderProjects(filtered);
    }

    // 5. Event Listeners
    searchInput.addEventListener('input', filterProjects);
    materialSelect.addEventListener('change', filterProjects);
    timeSelect.addEventListener('change', filterProjects);
    recipientSelect.addEventListener('change', filterProjects);
});
