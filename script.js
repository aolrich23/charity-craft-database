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
            card.className = 'ui-card ui-card--interactive card';
            card.onclick = () => showProjectDetails(project.id);
            
            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${project.image || 'https://via.placeholder.com/400x400?text=Project+Image'}" alt="${project.title}">
                </div>
                <div class="card-body">
                    <div class="org-row">
                        ${project.organiser.image ? `<img src="${project.organiser.image}" class="card-org-logo" alt="">` : ''}
                        <span class="org-name">${project.organiser.name}</span>
                    </div>
                    <h3>${project.title}</h3>
                    <div class="tag-row">
                        ${(Array.isArray(project.category) ? project.category : [project.category])
                            .map(cat => `<span class="badge badge--teal"><i class="ti ti-tag"></i> ${cat}</span>`).join('')}
                    </div>
                    <div class="tag-row">
                        ${(Array.isArray(project.craft) ? project.craft : [project.craft])
                            .map(c => `<span class="badge badge--outline"><i class="ti ${c.toLowerCase().includes('sewing') ? 'ti-scissors' : 'ti-needle-thread'}"></i> ${c}</span>`).join('')}
                    </div>
                    <div class="card-footer-time">
                        <i class="ti ti-clock"></i> ${project.approximateTime}
                    </div>
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

        window.location.hash = `project-${id}`;
        
        const materialList = project.materials.map(m => `${m.amount} ${m.type}`).join(', ') || 'PLACEHOLDER - TBD';

        detailsContent.innerHTML = `
            <div class="project-detail-container">
                <header class="detail-header-section">
                    <div class="header-top">
                        <h1 class="detail-title">${project.title}</h1>
                        <span class="muted-badge">last verified: ${project.lastVerified || 'PLACEHOLDER - TBD'}</span>
                    </div>
                    <div class="pill-container">
                        ${project.craft.map(c => `<span class="badge badge--outline">${c}</span>`).join('')}
                        ${project.category.map(cat => `<span class="badge badge--teal">${getCategoryEmoji(cat)} ${cat}</span>`).join('')}
                    </div>
                </header>

                <div class="detail-card-stack">
                    <section class="ui-card minimal-card split-card">
                        <div class="card-info">
                            <span class="card-label">about the cause</span>
                            <div class="row-item"><i class="ti ti-building"></i><span class="label">organisation:</span><span class="value">${project.organiser.name}</span></div>
                            <div class="row-item"><i class="ti ti-users"></i><span class="label">who they help:</span><span class="value">${project.whoTheyHelp || 'PLACEHOLDER - TBD'}</span></div>
                        </div>
                        ${project.organiser.image ? `<img src="${project.organiser.image}" alt="" class="card-side-image organisation-logo">` : ''}
                    </section>

                    <section class="ui-card minimal-card split-card">
                        <div class="card-info">
                            <span class="card-label">about the project</span>
                            <div class="row-item"><i class="ti ti-package"></i><span class="label">what you make:</span><span class="value">${project.whatYouMake || 'PLACEHOLDER - TBD'}</span></div>
                            <div class="row-item"><i class="ti ti-chart-bar"></i><span class="label">skill level:</span><span class="value">${project.skillLevel || 'PLACEHOLDER - TBD'}</span></div>
                            <div class="row-item"><i class="ti ti-clock"></i><span class="label">time estimate:</span><span class="value">${project.approximateTime}</span></div>
                            <div class="row-item"><i class="ti ti-needle"></i><span class="label">materials:</span><span class="value">${materialList}</span></div>
                            <div class="row-item"><i class="ti ti-file-text"></i><span class="label">patterns:</span><span class="value"><a href="${project.pattern.url}" target="_blank">${project.pattern.text}</a></span></div>
                        </div>
                        ${project.image ? `<img src="${project.image}" alt="" class="card-side-image project-image">` : ''}
                    </section>

                    <section class="ui-card minimal-card">
                        <span class="card-label">how to contribute</span>
                        ${project.contribution?.mail ? `<div class="row-item"><i class="ti ti-mail"></i><span class="label">by post:</span><span class="value">${project.contribution.mail}</span></div>` : ''}
                        ${project.contribution?.inPerson ? `<div class="row-item"><i class="ti ti-building-store"></i><span class="label">in person:</span><span class="value">${project.contribution.inPerson}</span></div>` : ''}
                        <div class="row-item note-row"><i class="ti ti-info-circle"></i><span class="value">please ensure all items are clean and free of pet hair before sending.</span></div>
                    </section>

                    <section class="ui-card minimal-card">
                        <span class="card-label">join the community</span>
                        <div class="community-list">
                            ${project.community?.facebookUrl ? `
                            <a href="${project.community.facebookUrl}" target="_blank" class="row-item community-link">
                                <i class="ti ti-brand-facebook"></i>
                                <div class="community-info">
                                    <span class="value">facebook group</span>
                                    <span class="muted-text">${project.community.facebookText || 'share progress and ask questions.'}</span>
                                </div>
                                <span class="badge badge--blue"><i class="ti ti-world"></i> online</span>
                            </a>` : ''}
                        </div>
                    </section>

                    <section class="story-section">
                        <blockquote class="story-quote">${project.andieStory || 'PLACEHOLDER - TBD'}</blockquote>
                        <cite class="story-attribution">andie, founder of make it matter</cite>
                    </section>

                    <section class="ui-card minimal-card contact-section">
                        <span class="card-label">get in touch</span>
                        <p class="muted-text">for specific questions about this project, please reach out to the organisers directly.</p>
                        <div class="button-row">
                            <a href="${project.organiser.url}" target="_blank" class="ui-button ui-button--secondary">
                                <i class="ti ti-world"></i> visit website
                            </a>
                            <a href="mailto:andiecrafted@gmail.com" class="ui-button ui-button--secondary">
                                <i class="ti ti-mail"></i> contact form
                            </a>
                        </div>
                    </section>
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
