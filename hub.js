// Dev Utils Hub enhancements - Favorites, Command Palette, Export/Import, PWA helpers
(function(){
    'use strict';

    const FAVORITES_KEY = 'devutils-favorites';
    const SETTINGS_KEY = 'devutils-settings-backup';

    function getFavorites(){
        try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch(e){ return []; }
    }
    function saveFavorites(favs){
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    }

    function initFavorites(){
        const toolsGrid = document.getElementById('toolsGrid');
        if(!toolsGrid) return;
        const pinnedSection = document.getElementById('pinnedSection');
        const pinnedGrid = document.getElementById('pinnedGrid');
        if(!pinnedSection) {
            const section = document.createElement('div');
            section.id = 'pinnedSection';
            section.className = 'mb-3';
            section.style.display = 'none';
            section.innerHTML = '<h2 class="h6 text-secondary mb-2"><i class="bi bi-pin-angle me-2"></i>Pinned</h2><div class="row g-4" id="pinnedGrid"></div>';
            const header = document.querySelector('main .d-flex.justify-content-between.align-items-center');
            if(header && header.nextSibling) {
                header.parentNode.insertBefore(section, header.nextSibling);
            } else if(toolsGrid) {
                toolsGrid.parentNode.insertBefore(section, toolsGrid);
            }
        }
        const pGrid = document.getElementById('pinnedGrid');
        const pSection = document.getElementById('pinnedSection');
        if(!pGrid) return;

        function apply(){
            const favs = new Set(getFavorites());
            pGrid.innerHTML = '';
            const cards = Array.from(toolsGrid.querySelectorAll('.tool-card'));
            cards.forEach(card => {
                const tid = card.dataset.toolId;
                if(tid === 'more') return;
                // ensure favorite toggle exists
                let btn = card.querySelector('.favorite-toggle');
                if(!btn){
                    btn = document.createElement('button');
                    btn.className = 'btn btn-sm btn-link text-secondary favorite-toggle position-absolute';
                    btn.style.cssText = 'top:8px; right:8px; z-index:5;';
                    btn.title = 'Pin/unpin';
                    btn.innerHTML = '<i class="bi bi-pin"></i>';
                    card.style.position = card.style.position || 'relative';
                    card.appendChild(btn);
                }
                if(favs.has(tid)){
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="bi bi-pin-fill"></i>';
                    const clone = card.cloneNode(true);
                    clone.classList.add('pinned-clone');
                    clone.querySelectorAll('.favorite-toggle').forEach(b => b.remove());
                    const cbtn = document.createElement('button');
                    cbtn.className = 'btn btn-sm btn-link active favorite-toggle position-absolute';
                    cbtn.style.cssText = 'top:8px; right:8px; z-index:5;';
                    cbtn.title = 'Unpin';
                    cbtn.innerHTML = '<i class="bi bi-pin-fill"></i>';
                    cbtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggle(tid); };
                    clone.style.position = 'relative';
                    clone.appendChild(cbtn);
                    pGrid.appendChild(clone);
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = '<i class="bi bi-pin"></i>';
                }
                btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggle(tid); };
            });
            pSection.style.display = pGrid.children.length ? 'block' : 'none';
        }
        function toggle(tid){
            const favs = getFavorites();
            const idx = favs.indexOf(tid);
            if(idx >= 0) favs.splice(idx, 1); else favs.push(tid);
            saveFavorites(favs);
            apply();
        }
        apply();
    }

    function initExportImport(){
        let exportBtn = document.getElementById('exportSettingsBtn');
        let importInput = document.getElementById('importSettingsInput');
        const header = document.querySelector('main .d-flex.justify-content-between.align-items-center');
        if(header && (!exportBtn || !importInput)){
            const btnGroup = header.querySelector('.d-flex.gap-2');
            if(btnGroup){
                if(!exportBtn){
                    exportBtn = document.createElement('button');
                    exportBtn.id = 'exportSettingsBtn';
                    exportBtn.className = 'btn btn-sm btn-outline-secondary';
                    exportBtn.title = 'Export settings';
                    exportBtn.innerHTML = '<i class="bi bi-download me-1"></i>Export';
                    btnGroup.appendChild(exportBtn);
                }
                if(!importInput){
                    importInput = document.createElement('input');
                    importInput.type = 'file';
                    importInput.id = 'importSettingsInput';
                    importInput.accept = 'application/json';
                    importInput.hidden = true;
                    const label = document.createElement('label');
                    label.className = 'btn btn-sm btn-outline-secondary mb-0';
                    label.title = 'Import settings';
                    label.innerHTML = '<i class="bi bi-upload me-1"></i>Import';
                    label.appendChild(importInput);
                    btnGroup.appendChild(label);
                }
            }
        }
        if(exportBtn){
            exportBtn.onclick = () => {
                const data = {
                    version: 1,
                    order: localStorage.getItem('devutils-tool-order'),
                    favorites: localStorage.getItem('devutils-favorites'),
                    exportedAt: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'devutils-settings.json'; a.click();
                URL.revokeObjectURL(url);
            };
        }
        if(importInput){
            importInput.onchange = (e) => {
                const f = e.target.files[0];
                if(!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const data = JSON.parse(reader.result);
                        if(data.order) localStorage.setItem('devutils-tool-order', data.order);
                        if(data.favorites) localStorage.setItem('devutils-favorites', data.favorites);
                        location.reload();
                    } catch(err) {
                        alert('Invalid settings file');
                    }
                };
                reader.readAsText(f);
            };
        }
    }

    function initCommandPalette(){
        let openBtn = document.getElementById('openCmdPalette');
        const header = document.querySelector('main .d-flex.justify-content-between.align-items-center');
        if(header && !openBtn){
            const btnGroup = header.querySelector('.d-flex.gap-2');
            if(btnGroup){
                openBtn = document.createElement('button');
                openBtn.id = 'openCmdPalette';
                openBtn.className = 'btn btn-sm btn-outline-secondary';
                openBtn.title = 'Command Palette (Ctrl+K)';
                openBtn.innerHTML = '<i class="bi bi-command me-1"></i>Search';
                btnGroup.prepend(openBtn);
            }
        }
        if(document.getElementById('cmdPalette')) return;
        const palette = document.createElement('div');
        palette.id = 'cmdPalette';
        palette.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:none;align-items:flex-start;justify-content:center;padding-top:10vh;z-index:9999;';
        palette.innerHTML = '<div class="glass-panel" style="width:min(600px,90vw);max-height:60vh;overflow:auto;"><div class="p-2"><input id="cmdInput" class="form-control bg-transparent text-white border-secondary" placeholder="Search tools..."></div><div id="cmdResults" class="p-2"></div></div>';
        document.body.appendChild(palette);
        const cmdInput = palette.querySelector('#cmdInput');
        const cmdResults = palette.querySelector('#cmdResults');
        function open(){ palette.style.display = 'flex'; cmdInput.value = ''; render(''); setTimeout(()=>cmdInput.focus(), 50); }
        function close(){ palette.style.display = 'none'; }
        openBtn?.addEventListener('click', open);
        document.addEventListener('keydown', (e) => {
            if((e.ctrlKey && e.key === 'k') || e.key === '/'){
                const tag = document.activeElement.tagName;
                if(tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;
                e.preventDefault();
                open();
            }
            if(e.key === 'Escape') close();
        });
        palette.addEventListener('click', (e) => { if(e.target === palette) close(); });
        const toolsGrid = document.getElementById('toolsGrid');
        const allTools = toolsGrid ? Array.from(toolsGrid.querySelectorAll('.tool-card')).filter(c => c.dataset.toolId !== 'more').map(c => ({
            id: c.dataset.toolId,
            title: c.querySelector('h3')?.textContent || '',
            desc: c.querySelector('p')?.textContent || '',
            href: c.querySelector('a')?.href || '#'
        })) : [];
        function render(q){
            const query = q.toLowerCase();
            const items = allTools.filter(t => !query || t.title.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query));
            cmdResults.innerHTML = items.slice(0, 30).map(t => '<div class="p-2 cmd-item" data-href="' + t.href.replace(/"/g,'&quot;') + '" style="cursor:pointer;border-radius:8px;">' +
                '<div class="text-white">' + t.title.replace(/</g,'&lt;') + '</div><div class="text-secondary small">' + t.desc.substring(0, 90).replace(/</g,'&lt;') + '</div></div>').join('') ||
                '<div class="text-secondary p-2">No results</div>';
            cmdResults.querySelectorAll('.cmd-item').forEach(el => {
                el.onmouseover = () => el.style.background = 'rgba(255,255,255,0.05)';
                el.onmouseout = () => el.style.background = 'transparent';
                el.onclick = () => { location.href = el.dataset.href; };
            });
        }
        cmdInput.addEventListener('input', (e) => render(e.target.value));
    }

    // URL state helpers (shareable tool state via hash)
    function initUrlState(){
        const toolMatch = location.pathname.match(/([^/]+)\.html$/);
        if(!toolMatch) return;
        const hash = location.hash.replace(/^#/, '');
        if(hash){
            try {
                const decoded = hash.startsWith('state=') ? hash.slice(6) : hash;
                const state = JSON.parse(decodeURIComponent(atob(decoded)));
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach(el => {
                    const name = el.id || el.name;
                    if(name && state[name] !== undefined){
                        if(el.type === 'checkbox') el.checked = !!state[name];
                        else el.value = state[name];
                        el.dispatchEvent(new Event('input'));
                    }
                    if(state.v !== undefined && el.tagName === 'TEXTAREA' && !el.value){
                        el.value = state.v;
                        el.dispatchEvent(new Event('input'));
                    }
                });
            } catch(e){}
        }
    }

    // Tool chaining: "Send to..." 
    function initSendTo(){
        const page = location.pathname.match(/([^/]+)\.html$/);
        if(!page) return;
        const current = page[1];
        const map = { 'base64-converter': 'json-formatter', 'list-diff': 'column-converter', 'xml-formatter': 'json-formatter' };
        const target = map[current];
        if(!target) return;
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-info position-fixed';
        btn.style.cssText = 'bottom:20px; right:20px; z-index:1000;';
        btn.innerHTML = '<i class="bi bi-arrow-right me-1"></i>Send to next tool';
        btn.onclick = () => {
            const ta = document.querySelector('textarea');
            const text = ta ? ta.value : document.body.textContent;
            try {
                const b64 = btoa(unescape(encodeURIComponent(JSON.stringify({v: text}))));
                location.href = target + '.html#state=' + b64;
            } catch(e){}
        };
        document.body.appendChild(btn);
    }

    // PWA registration (guarded)
    function initPWA(){
        if('serviceWorker' in navigator && location.protocol.startsWith('http')){
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').catch(()=>{});
            });
        }
    }

    function init(){
        if(document.readyState === 'loading'){
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        initFavorites();
        initExportImport();
        initCommandPalette();
        try { initUrlState(); } catch(e){}
        try { initSendTo(); } catch(e){}
        try { initPWA(); } catch(e){}
    }
    init();
})();
