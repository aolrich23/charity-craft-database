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

        // Get unique categories (formerly recipients)
        const categories = [...new Set(data.map(item => item.category))].sort();
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
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
                ${project.image ? `<img src="${project.image}" alt="${project.title}" class="card-image">` : ''}
                <div class="card-header">
                    <h3>${project.title}</h3>
                    <span class="tag need-${project.need.toLowerCase()}">Need: ${project.need}</span>
                </div>
                <p class="organiser"><strong>Organiser:</strong> <a href="${project.organiser.url}" target="_blank">${project.organiser.name}</a></p>
                <div class="card-meta">
                    <span><strong>Category:</strong> ${project.category}</span>
                    <span><strong>Craft:</strong> ${project.craft}</span>
                    <span><strong>Material:</strong> <span class="tag">${project.materialType}</span></span>
                    <span><strong>Amount:</strong> ${project.materialAmount}</span>
                    <span><strong>Time:</strong> ${project.approximateTime}</span>
                    <span><strong>Deadline:</strong> ${project.deadline}</span>
                </div>
                <p class="description">${project.description || ''}</p>
                <div class="card-footer">
                    <a href="${project.pattern.url}" target="_blank" class="pattern-link">📄 ${project.pattern.text}</a>
                    <small>Updated: ${new Date(project.lastUpdated).toLocaleDateString()}</small>
                </div>
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

            // Category Filter (mapped to recipient select)
            const matchesCategory = recipientValue === '' || project.category === recipientValue;

            // Time Filter (Parsing logic)
            // Assumes format "X hours" or similar. 
            const hours = parseInt(project.approximateTime); 
            let matchesTime = true;
            if (timeValue === 'short') matchesTime = hours < 3;
            else if (timeValue === 'medium') matchesTime = hours >= 3 && hours <= 10;
            else if (timeValue === 'long') matchesTime = hours > 10;

            return matchesSearch && matchesMaterial && matchesCategory && matchesTime;
        });

        renderProjects(filtered);
    }

    // 5. Event Listeners
    searchInput.addEventListener('input', filterProjects);
    materialSelect.addEventListener('change', filterProjects);
    timeSelect.addEventListener('change', filterProjects);
    recipientSelect.addEventListener('change', filterProjects);
});
