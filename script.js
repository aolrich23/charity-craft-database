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
        const createCheckbox = (container, value, labelText) => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${value}"> ${labelText}`;
            label.querySelector('input').addEventListener('change', filterProjects);
            container.appendChild(label);
        };

        // Get unique crafts
        const crafts = [...new Set(data.flatMap(item => item.craft))].sort();
        crafts.forEach(craft => createCheckbox(craftSelect, craft, craft));

        // Get unique materials
        const materials = [...new Set(data.flatMap(item => item.materials.map(m => m.type)))].sort();
        materials.forEach(mat => createCheckbox(materialSelect, mat, mat));

        // Get unique categories (formerly recipients)
        const categories = [...new Set(data.flatMap(item => item.category))].sort();
        categories.forEach(cat => createCheckbox(recipientSelect, cat, `${getCategoryEmoji(cat)} ${cat}`));

        // Get unique time estimates
        const times = [...new Set(data.map(item => item.approximateTime))].sort((a, b) => {
            const getVal = s => {
                if (s.toLowerCase().includes('less')) return 0;
                if (s.toLowerCase().includes('more')) return 999;
                return parseInt(s) || 0;
            };
            return getVal(a) - getVal(b);
        });
        times.forEach(time => createCheckbox(timeSelect, time, time));
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
            
            const categoryTags = (Array.isArray(project.category) ? project.category : [project.category])
                .map(cat => `<span class="tag">${getCategoryEmoji(cat)} ${cat}</span>`)
                .join('');

            card.innerHTML = `
                <img src="${project.image || 'https://via.placeholder.com/400x400?text=Project+Image'}" alt="${project.title}" class="card-image">
                <div class="card-header">
                    <h3>${project.title}</h3>
                </div>
                <p class="organiser">${project.organiser.name}</p>
                <div class="card-meta">
                    <span class="tag">${Array.isArray(project.craft) ? project.craft[0] : project.craft}</span>
                    <span class="tag">⏱️ ${project.approximateTime}</span>
                </div>
                <div class="card-meta">
                    ${categoryTags}
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
        const getSelected = (container) => Array.from(container.querySelectorAll('input:checked')).map(i => i.value);
        
        const selectedCrafts = getSelected(craftSelect);
        const selectedMaterials = getSelected(materialSelect);
        const selectedTimes = getSelected(timeSelect);
        const selectedCategories = getSelected(recipientSelect);

        const filtered = projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchTerm) || 
                                  project.description.toLowerCase().includes(searchTerm);

            const matchesCraft = selectedCrafts.length === 0 || project.craft.some(c => selectedCrafts.includes(c));
            const matchesMaterial = selectedMaterials.length === 0 || project.materials.some(m => selectedMaterials.includes(m.type));
            const matchesCategory = selectedCategories.length === 0 || project.category.some(c => selectedCategories.includes(c));
            const matchesTime = selectedTimes.length === 0 || selectedTimes.includes(project.approximateTime);

            return matchesSearch && matchesCraft && matchesMaterial && matchesCategory && matchesTime;
        });

        renderProjects(filtered);
    }

    // 5. Event Listeners
    searchInput.addEventListener('input', filterProjects);
    backBtn.addEventListener('click', closeDetails);
    window.addEventListener('hashchange', handleRouting);
});
