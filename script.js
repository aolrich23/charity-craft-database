document.addEventListener('DOMContentLoaded', () => {
    let projects = [];
    const urlParams = new URLSearchParams(window.location.search);
    const searchView = document.getElementById('searchView');
    const projectDetails = document.getElementById('projectDetails');
    const homeView = document.getElementById('homeView');

    // 1. Fetch Data
    fetch('./data.json')
        .then(response => response.json())
        .then(data => {
            projects = data;
            if (homeView) initHomePage();
            if (searchView) initSearchPage();
            if (projectDetails) initProjectPage();
        })
        .catch(error => console.error('Error loading data:', error));

    function initHomePage() {
        const heroBrowseBtn = document.getElementById('heroBrowseBtn');
        const bottomBrowseBtn = document.getElementById('bottomBrowseBtn');
        if (heroBrowseBtn) heroBrowseBtn.addEventListener('click', () => window.location.href = 'search.html');
        if (bottomBrowseBtn) bottomBrowseBtn.addEventListener('click', () => window.location.href = 'search.html');
    }

    function initSearchPage() {
        populateDropdowns(projects);
        applyFiltersFromURL();
        filterProjects();
        const searchInput = document.getElementById('search');
        if (searchInput) searchInput.addEventListener('input', () => {
            updateURL();
            filterProjects();
        });
    }

    function initProjectPage() {
        const id = parseInt(urlParams.get('id'));
        if (id) showProjectDetails(id);
    }

    function updateURL() {
        const searchInput = document.getElementById('search');
        const params = new URLSearchParams();
        if (searchInput.value) params.set('q', searchInput.value);
        
        const getChecked = (selector) => Array.from(document.querySelectorAll(`${selector} input:checked`)).map(i => i.value);
        const crafts = getChecked('#craftFilter');
        const categories = getChecked('#recipientFilter');
        
        if (crafts.length) params.set('craft', crafts.join(','));
        if (categories.length) params.set('category', categories.join(','));
        
        const newRelativePathQuery = window.location.pathname + '?' + params.toString();
        window.history.replaceState(null, '', newRelativePathQuery);
    }

    // 2. Populate Dynamic Dropdowns (Material & Recipient)
    function populateDropdowns(data) {
        const craftSelect = document.getElementById('craftFilter');
        const materialSelect = document.getElementById('materialFilter');
        const timeSelect = document.getElementById('timeFilter');
        const recipientSelect = document.getElementById('recipientFilter');

        const createCheckbox = (container, value, labelText) => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${value}"> ${labelText}`;
            label.querySelector('input').addEventListener('change', () => {
                updateURL();
                filterProjects();
            });
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

    function applyFiltersFromURL() {
        const searchInput = document.getElementById('search');
        if (urlParams.has('q') && searchInput) searchInput.value = urlParams.get('q');
        
        const setCheckboxes = (paramKey, filterId) => {
            if (!urlParams.has(paramKey)) return;
            const values = urlParams.get(paramKey).split(',');
            values.forEach(val => {
                const cb = document.querySelector(`#${filterId} input[value="${val}"]`);
                if (cb) cb.checked = true;
            });
        };

        setCheckboxes('craft', 'craftFilter');
        setCheckboxes('category', 'recipientFilter');
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
        const grid = document.getElementById('projectGrid');
        const noResultsMsg = document.getElementById('noResults');
        if (!grid) return;
        
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
            card.onclick = () => window.location.href = `project.html?id=${project.id}`;
            
            const categoryTags = (Array.isArray(project.category) ? project.category : [project.category])
                .map(cat => `<span class="tag">${getCategoryEmoji(cat)} ${cat}</span>`)
                .join('');

        const craftTags = (Array.isArray(project.craft) ? project.craft : [project.craft])
            .map(craft => `<span class="tag">${craft}</span>`)
            .join('');

            card.innerHTML = `
                <img src="${project.image || 'https://via.placeholder.com/400x400?text=Project+Image'}" alt="${project.title}" class="card-image">
                <div class="card-header">
                    <h3>${project.title}</h3>
                </div>
                <p class="organiser">${project.organiser.name}</p>
                <div class="card-meta">
                ${craftTags}
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
        const detailsContent = document.getElementById('detailsContent');
        if (!detailsContent) return;
        
        const project = projects.find(p => p.id === id);
        if (!project) return;

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
    }

    // 4. Filter Logic
    function filterProjects() {
        const searchInput = document.getElementById('search');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const getCheckedValues = (id) => Array.from(document.querySelectorAll(`#${id} input:checked`)).map(i => i.value);
        
        const selectedCrafts = getCheckedValues('craftFilter');
        const selectedMaterials = getCheckedValues('materialFilter');
        const selectedTimes = getCheckedValues('timeFilter');
        const selectedCategories = getCheckedValues('recipientFilter');

        const filtered = projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchTerm);
            const matchesCraft = selectedCrafts.length === 0 || project.craft.some(c => selectedCrafts.includes(c));
            const matchesMaterial = selectedMaterials.length === 0 || project.materials.some(m => selectedMaterials.includes(m.type));
            const matchesCategory = selectedCategories.length === 0 || project.category.some(c => selectedCategories.includes(c));
            const matchesTime = selectedTimes.length === 0 || selectedTimes.includes(project.approximateTime);
            return matchesSearch && matchesCraft && matchesMaterial && matchesCategory && matchesTime;
        });
        renderProjects(filtered);
    }
});
