// Language Switcher for Fast Shipment Platform

document.addEventListener('DOMContentLoaded', function() {
    initLanguageSwitcher();
});

function initLanguageSwitcher() {
    const languageSelect = document.getElementById('languageSelect');
    
    if (languageSelect) {
        // Set initial language based on browser or stored preference
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'ar';
        languageSelect.value = savedLanguage;
        switchLanguage(savedLanguage);
        
        // Add event listener for language change
        languageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            switchLanguage(selectedLanguage);
            localStorage.setItem('preferredLanguage', selectedLanguage);
        });
    }
}

function switchLanguage(language) {
    // Update html lang attribute and dir
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Show/hide language-specific elements
    const allLangElements = document.querySelectorAll('[data-lang]');
    
    allLangElements.forEach(element => {
        if (element.getAttribute('data-lang') === language) {
            element.style.display = element.tagName === 'OPTION' ? '' : 'inline';
        } else {
            element.style.display = 'none';
        }
    });
    
    // Special handling for block elements
    const blockElements = document.querySelectorAll('h1[data-lang], h2[data-lang], h3[data-lang], p[data-lang], div[data-lang]');
    blockElements.forEach(element => {
        if (element.getAttribute('data-lang') === language) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    });
    
    // Update any dynamic content based on language
    updateDynamicContent(language);
}

function updateDynamicContent(language) {
    // Update any dynamic content that isn't handled by data-lang attributes
    // For example, update placeholder texts, aria-labels, etc.
    
    // You can add more dynamic content updates here as needed
    console.log(`Language switched to: ${language}`);
}

// Make function available globally
window.switchLanguage = switchLanguage;