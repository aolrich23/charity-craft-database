document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('projectGrid');
    const searchView = document.getElementById('searchView');
    const projectDetails = document.getElementById('projectDetails');
    const detailsContent = document.getElementById('detailsContent');
    const backBtn = document.getElementById('backToList');

    const searchInput = document.getElementById('search');
    const craftSelect = document.getElementById('craftFilter');
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
            handleRouting();
        })
        .catch(error => console.error('Error loading data:', error));

    // 2. Populate Dynamic Dropdowns (Material & Recipient)
    function populateDropdowns(data) {
        // Get unique crafts
        const crafts = [...new Set(data.flatMap(item => item.craft))].sort();
        crafts.forEach(craft => {
            const option = document.createElement('option');
            option.value = craft;
            option.textContent = craft;
            craftSelect.appendChild(option);
        });

        // Get unique materials
        const materials = [...new Set(data.flatMap(item => item.materials.map(m => m.type)))].sort();
        materials.forEach(mat => {
            const option = document.createElement('option');
            option.value = mat;
            option.textContent = mat;
            materialSelect.appendChild(option);
        });

        // Get unique categories (formerly recipients)
        const categories = [...new Set(data.flatMap(item => item.category))].sort();
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            recipientSelect.appendChild(option);
        });
    }

    function getCategoryEmoji(category) {
        const cat = (category || "").toLowerCase();
        if (cat.includes('animal')) return '🐾';
        if (cat.includes('disaster') || cat.includes('emergency')) return '🆘';
        if (cat.includes('community')) return '🤝';
        return '❤️';
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

        data.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => showProjectDetails(project.id);
            
            const primaryCategory = Array.isArray(project.category) ? project.category[0] : project.category;

            card.innerHTML = `
                <img src="${project.image || 'https://via.placeholder.com/400x400?text=Project+Image'}" alt="${project.title}" class="card-image">
                <div class="card-header">
                    <h3>${project.title}</h3>
                </div>
                <p class="organiser">${project.organiser.name}</p>
                <div class="card-meta">
                    <span class="tag">${Array.isArray(project.craft) ? project.craft[0] : project.craft}</span>
                    <span class="meta-item">⏱️ ${project.approximateTime}</span>
                    <span class="meta-item">${getCategoryEmoji(primaryCategory)} ${primaryCategory}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function showProjectDetails(id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        // Update URL hash for sharing/back button support
        window.location.hash = `project-${id}`;

        detailsContent.innerHTML = `
            <div class="detail-grid">
                <div class="detail-main">
                    <h1>${project.title}</h1>
                    <p class="organiser">Organised by <a href="${project.organiser.url}" target="_blank">${project.organiser.name}</a></p>
                    
                    <div class="description" style="padding: 0; margin-top: 20px;">
                        <h3>About this project</h3>
                        <p>${project.description || 'No description provided.'}</p>
                    </div>

                    <div class="detail-gallery">
                        <img src="${project.image || 'https://via.placeholder.com/400x400?text=Image+1'}" alt="Gallery 1">
                        <img src="https://via.placeholder.com/400x400?text=Image+2" alt="Gallery 2">
                        <img src="https://via.placeholder.com/400x400?text=Image+3" alt="Gallery 3">
                        <img src="https://via.placeholder.com/400x400?text=Image+4" alt="Gallery 4">
                    </div>
                </div>

                <div class="detail-sidebar">
                    <h4>Project Details</h4>
                    <div class="card-meta" style="display:flex; flex-direction:column; gap:15px; padding:0;">
                        <span><strong>Craft:</strong> ${project.craft.join(', ')}</span>
                        <span><strong>Category:</strong> ${project.category.join(', ')}</span>
                        <span><strong>Time:</strong> ${project.approximateTime}</span>
                    </div>

                    <h4 style="margin-top:25px;">Materials Required</h4>
                    <ul style="list-style: none; font-size: 0.9rem;">
                        ${project.materials.map(m => `<li>• ${m.amount} ${m.type}</li>`).join('')}
                    </ul>

                    <div style="margin-top:30px;">
                        <a href="${project.pattern.url}" target="_blank" class="pattern-link" style="display:block; text-align:center;">Download Pattern</a>
                    </div>
                </div>
            </div>
        `;

        searchView.classList.add('hidden');
        projectDetails.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    function closeDetails() {
        window.location.hash = '';
        projectDetails.classList.add('hidden');
        searchView.classList.remove('hidden');
    }

    function handleRouting() {
        const hash = window.location.hash;
        if (hash.startsWith('#project-')) {
            const id = parseInt(hash.replace('#project-', ''));
            showProjectDetails(id);
        } else {
            closeDetails();
        }
    }

    // 4. Filter Logic
    function filterProjects() {
        const searchTerm = searchInput.value.toLowerCase();
        const craftValue = craftSelect.value;
        const materialValue = materialSelect.value;
        const timeValue = timeSelect.value;
        const recipientValue = recipientSelect.value;

        const filtered = projects.filter(project => {
            // Search Text (Title or Description)
            const matchesSearch = project.title.toLowerCase().includes(searchTerm) || 
                                  project.description.toLowerCase().includes(searchTerm);

            // Craft Filter
            const matchesCraft = craftValue === '' || (Array.isArray(project.craft) ? project.craft.includes(craftValue) : project.craft === craftValue);

            // Material Filter
            const matchesMaterial = materialValue === '' || project.materials.some(m => m.type === materialValue);

            // Category Filter (mapped to recipient select)
            const matchesCategory = recipientValue === '' || (Array.isArray(project.category) ? project.category.includes(recipientValue) : project.category === recipientValue);

            // Time Filter (Parsing logic)
            // Assumes format "X hours" or similar. 
            const hours = parseInt(project.approximateTime); 
            let matchesTime = true;
            if (timeValue === 'short') matchesTime = hours < 3;
            else if (timeValue === 'medium') matchesTime = hours >= 3 && hours <= 10;
            else if (timeValue === 'long') matchesTime = hours > 10;

            return matchesSearch && matchesCraft && matchesMaterial && matchesCategory && matchesTime;
        });

        renderProjects(filtered);
    }

    // 5. Event Listeners
    searchInput.addEventListener('input', filterProjects);
    craftSelect.addEventListener('change', filterProjects);
    materialSelect.addEventListener('change', filterProjects);
    timeSelect.addEventListener('change', filterProjects);
    recipientSelect.addEventListener('change', filterProjects);
    backBtn.addEventListener('click', closeDetails);
    window.addEventListener('hashchange', handleRouting);
});
