// public/js/loader.js

class LoaderManager {
    constructor() {
        this.loader = document.getElementById('global-loader');
        this.timeout = null;
        this.minDisplayTime = 400;
        this.startTime = null;
        this.isLoading = false;
        
        if (!this.loader) return;
        
        this.hide();
        this.setupEventListeners();
    }
    
    show() {
        if (!this.loader) return;
        this.loader.style.display = 'block';
        this.startTime = Date.now();
        this.isLoading = true;
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        if (!this.loader) return;
        const elapsed = Date.now() - this.startTime;
        const remaining = this.minDisplayTime - elapsed;
        
        if (remaining > 0 && this.isLoading) {
            setTimeout(() => {
                this.loader.style.display = 'none';
                this.isLoading = false;
                document.body.style.overflow = '';
            }, remaining);
        } else {
            this.loader.style.display = 'none';
            this.isLoading = false;
            document.body.style.overflow = '';
        }
    }
    
    setupEventListeners() {
        // Links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || 
                href.startsWith('mailto:') || href.startsWith('tel:')) return;
            
            const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);
            if (isExternal) return;
            
            const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.jpg', '.png'];
            if (fileExtensions.some(ext => href.endsWith(ext))) return;
            
            this.show();
        });
        
        // Forms
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form && form.tagName === 'FORM') {
                const action = form.getAttribute('action');
                if (action && form.method.toLowerCase() !== 'get') {
                    this.show();
                }
            }
        });
        
        // Page load
        window.addEventListener('load', () => this.hide());
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) this.hide();
        });
        
        // AJAX - Fetch
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const loader = LoaderManager.getInstance();
            loader.show();
            return originalFetch.apply(this, args).finally(() => loader.hide());
        };
        
        // AJAX - XHR
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            const loader = LoaderManager.getInstance();
            this.addEventListener('loadend', () => loader.hide());
            return originalXHROpen.apply(this, args);
        };
    }
}

let loaderInstance = null;
LoaderManager.getInstance = function() {
    if (!loaderInstance) {
        loaderInstance = new LoaderManager();
    }
    return loaderInstance;
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoaderManager.getInstance());
} else {
    LoaderManager.getInstance();
}