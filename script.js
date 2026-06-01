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

        const backBtn = document.querySelector('.back-button');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const savedParams = localStorage.getItem('searchParams') || '';
                window.location.href = 'search.html' + savedParams;
            });
        }
    }

    function updateURL() {
        const searchInput = document.getElementById('search');
        const params = new URLSearchParams();
        if (searchInput.value) params.set('q', searchInput.value);
        
        const setParam = (filterId, paramKey) => {
            const checked = Array.from(document.querySelectorAll(`#${filterId} input:checked`)).map(i => i.value);
            if (checked.length) params.set(paramKey, checked.join(','));
        };

        setParam('craftFilter', 'craft');
        setParam('recipientFilter', 'category');
        setParam('timeFilter', 'time');
        
        const newRelativePathQuery = window.location.pathname + '?' + params.toString();
        window.history.replaceState(null, '', newRelativePathQuery);
    }

    // 2. Populate Dynamic Dropdowns (Material & Recipient)
    function populateDropdowns(data) {
        const craftSelect = document.getElementById('craftFilter');
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
        setCheckboxes('time', 'timeFilter');
    }

    function createCategoryTagsHtml(categories) {
        return (Array.isArray(categories) ? categories : [categories])
            .map(cat => `<span class="badge badge--teal">${getCategoryEmoji(cat)} ${cat}</span>`)
            .join('');
    }

    function createCraftTagsHtml(crafts) {
        return (Array.isArray(crafts) ? crafts : [crafts])
            .map(c => {
                return `<span class="badge badge--teal">${c}</span>`;
            })
            .join('');
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
            grid.classList.add('hidden');
            return;
        } else {
            noResultsMsg.classList.add('hidden');
            grid.classList.remove('hidden');
        }

        data.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'ui-card ui-card--interactive card';
            card.onclick = () => {
                localStorage.setItem('searchParams', window.location.search);
                location.href = `project.html?id=${project.id}`;
            };

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${project.image || 'https://via.placeholder.com/400x400?text=Project+Image'}" alt="${project.title}">
                </div>
                <div class="card-body">
                    <div class="org-row">
                        <span class="org-name">${project.organiser.name}</span>
                    </div>
                    <h3>${project.title}</h3>
                    <div class="tag-row">
                        ${createCraftTagsHtml(project.craft)}
                    </div>
                    <div class="tag-row">
                        ${createCategoryTagsHtml(project.category)}
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

        let materialsHtml = project.materials.map(m => `${m.amount} ${m.type}`).join(', ') || 'PLACEHOLDER - TBD';
        if (project.materialNote) {
            materialsHtml += ` <span class="material-note">Note: ${project.materialNote}</span>`;
        }

        detailsContent.innerHTML = `
            <div class="project-detail-container">
                <header class="detail-header-section">
                    <div class="header-top">
                        <h1 class="detail-title">${project.title}</h1>
                        <span class="muted-badge"><i class="ti ti-circle-check"></i> Verified active - ${project.lastVerified}</span>
                    </div>
                    <div class="tag-row">
                        ${createCraftTagsHtml(project.craft)}
                        ${createCategoryTagsHtml(project.category)}
                    </div>
                </header>

                <div class="detail-card-stack">
                    <!-- About the cause -->
                    <section class="ui-card details-card split-card">
                        <div class="card-info">
                            <span class="card-label">About the cause</span>
                            <div class="row-item"><i class="ti ti-building"></i><span class="label">Organisation:</span><span class="value">${project.organiser.name}</span></div>
                            <div class="row-item"><i class="ti ti-users"></i><span class="label">Who they help:</span><span class="value">${project.whoTheyHelp || 'PLACEHOLDER - TBD'}</span></div>
                        </div>
                        ${project.organiser.image ? `<img src="${project.organiser.image}" alt="${project.organiser.name} logo" class="card-side-image organisation-logo">` : ''}
                    </section>

                    <!-- About the project -->
                    <section class="ui-card details-card split-card">
                        <div class="card-info">
                            <span class="card-label">About the project</span>
                            <div class="row-item"><i class="ti ti-package"></i><span class="label">What you make:</span><span class="value">${project.whatYouMake || 'PLACEHOLDER - TBD'}</span></div>
                            <div class="row-item"><i class="ti ti-chart-bar"></i><span class="label">Skill level:</span><span class="value">${project.skillLevel || 'PLACEHOLDER - TBD'}</span></div>
                            <div class="row-item"><i class="ti ti-clock"></i><span class="label">Time estimate:</span><span class="value">${project.approximateTime}</span></div>
                            <div class="row-item"><i class="ti ti-needle"></i><span class="label">Materials:</span><span class="value">${materialsHtml}</span></div>
                            <div class="row-item"><i class="ti ti-file-text"></i><span class="label">Patterns:</span><span class="value"><a href="${project.pattern.url}" target="_blank">${project.pattern.text}</a></span></div>
                        </div>
                        ${project.image ? `
                            <div class="project-image-container">
                                <img src="${project.image}" alt="${project.title}" class="card-side-image project-image">
                                ${project.imageAttribution ? `<p class="image-attribution">Image: ${project.imageAttribution}</p>` : ''}
                            </div>
                        ` : ''}
                    </section>

                    ${project.andieStory ? `
                    <!-- Andie's story -->
                    <section class="story-section">
                        <blockquote class="story-quote">${project.andieStory}</blockquote>
                        <cite class="story-attribution"> - Andie, Founder of Make It Matter</cite>
                    </section>
                    ` : ''}

                    <!-- How to contribute -->
                    <section class="ui-card details-card">
                        <span class="card-label">How to contribute</span>
                        ${project.contribution.mail ? `<div class="row-item"><i class="ti ti-mail"></i><span class="label">By post:</span><span class="value">${project.contribution.mail}</span></div>` : ''}
                        ${project.contribution.inPerson ? `<div class="row-item"><i class="ti ti-building-store"></i><span class="label">In person:</span><span class="value">${project.contribution.inPerson}</span></div>` : ''}
                        ${project.contribution.other1Text ? `<div class="row-item"><i class="ti ti-info-circle"></i><span class="label">${project.contribution.other1Text}:</span><span class="value">${project.contribution.other1Value}</span></div>` : ''}
                        ${project.contribution.other2Text ? `<div class="row-item"><i class="ti ti-info-circle"></i><span class="label">${project.contribution.other2Text}:</span><span class="value">${project.contribution.other2Value}</span></div>` : ''}
                    </section>

                    <!-- Join the community -->
                    <section class="ui-card details-card">
                        <span class="card-label">Join the community</span>
                        <div class="community-list">
                            ${project.community.facebookUrl ? `
                            <a href="${project.community.facebookUrl}" target="_blank" class="row-item community-link">
                                <i class="ti ti-brand-facebook"></i>
                                <div class="community-info">
                                    <span class="value">Facebook group</span>
                                    <span class="muted-text">${project.community.facebookText || 'share progress and ask questions.'}</span>
                                </div>
                                <span class="badge badge--blue"><i class="ti ti-world"></i> online</span>
                            </a>` : ''}
                            ${project.community.instagramUrl ? `
                            <a href="${project.community.instagramUrl}" target="_blank" class="row-item community-link">
                                <i class="ti ti-brand-instagram"></i>
                                <div class="community-info">
                                    <span class="value">Instagram</span>
                                    <span class="muted-text">${project.community.instagramText || 'see finished projects.'}</span>
                                </div>
                                <span class="badge badge--blue"><i class="ti ti-world"></i> online</span>
                            </a>` : ''}
                            ${project.community.other1Url ? `
                            <a href="${project.community.other1Url}" target="_blank" class="row-item community-link">
                                <i class="ti ti-users"></i>
                                <div class="community-info">
                                    <span class="value">${project.community.other1Text}</span>
                                </div>
                                <span class="badge ${project.community.other1Format === 'online' ? 'badge--blue' : 'badge--green'}"><i class="ti ti-${project.community.other1Format === 'online' ? 'world' : 'map-pin'}"></i> ${project.community.other1Format || 'In person'}</span>
                            </a>` : ''}
                        </div>
                    </section>

                    <!-- Get in touch -->
                    <section class="ui-card details-card contact-section">
                        <span class="card-label">Get in touch</span>
                        <p class="muted-text">Got questions about this project or organisation? Check their website or reach out to them directly.</p>
                        <div class="button-row">
                            <a href="${project.organiser.url}" target="_blank" class="ui-button ui-button--secondary">
                                <i class="ti ti-world"></i> Visit website
                            </a>
                            <a href="${project.contactUrl}" target="_blank" class="ui-button ui-button--secondary">
                                <i class="ti ti-mail"></i> Contact form
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
        const selectedTimes = getCheckedValues('timeFilter');
        const selectedCategories = getCheckedValues('recipientFilter');

        const filtered = projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchTerm) ||
                                  (project.whatYouMake && project.whatYouMake.toLowerCase().includes(searchTerm)) ||
                                  (project.whoTheyHelp && project.whoTheyHelp.toLowerCase().includes(searchTerm)) ||
                                  (project.equipment && project.equipment.toLowerCase().includes(searchTerm)) ||
                                  (project.organiser?.name && project.organiser.name.toLowerCase().includes(searchTerm)) ||
                                  (project.materials && project.materials.some(m => m.type && m.type.toLowerCase().includes(searchTerm)));

            const matchesCraft = selectedCrafts.length === 0 || project.craft.some(c => selectedCrafts.includes(c));
            const matchesCategory = selectedCategories.length === 0 || project.category.some(c => selectedCategories.includes(c));
            const matchesTime = selectedTimes.length === 0 || selectedTimes.includes(project.approximateTime);
            return matchesSearch && matchesCraft && matchesCategory && matchesTime;
        });
        renderProjects(filtered);
    }
});
