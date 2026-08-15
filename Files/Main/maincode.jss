/* ==========================================================
   PART 1: CONFIGURATION, CORE INITIALIZATION & NAVIGATION
   ========================================================== */

const allowedDomains = ["digidatas.github.io", "localhost", "127.0.0.1"];
const currentDomain = window.location.hostname;

if (!allowedDomains.includes(currentDomain) && currentDomain !== "") {
    document.body.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f8fafc; font-family:sans-serif; color:#ef4444;"><h2>Unauthorized Domain. Access Denied.</h2></div>`;
    throw new Error("Security Lock Triggered."); 
}

document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'U') || (e.metaKey && e.altKey && e.key === 'I')) {
        e.preventDefault(); return false;
    }
});

let rawBranding = {};
let rawOffers = [];
let rawMenuEn = [];
let rawMenuAr = [];
let currentLang = 'en'; 
let langSetup = 'English&Arabic'; 
let globalCurrency = ""; 
const newRiyalIcon = `<svg class="inline-block w-[0.8em] h-[0.8em] mx-0.5 fill-current" viewBox="0 0 202.03 220.76" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M3.62,190.51c1.85-3.4,4.63-11.11,8.33-12.04l62.35-13.27v-30.87l-63.28,13.58c-1.23,0,3.09-13.27,3.4-13.89,1.54-3.4,4.32-11.11,8.03-12.04l51.86-11.11V20.42c0-4.94,8.64-11.73,11.42-14.51.93-.62,9.88-8.64,9.88-4.94v105.57l24.69-5.56V31.84c0-4.94,8.64-11.73,11.73-14.2.62-.93,9.57-8.64,9.57-5.25v84.27l58.34-12.35h.31l1.23-.31c.93-.31-3.09,12.96-3.7,13.89-1.54,3.09-4.32,11.11-8.03,11.73l-48.15,10.5v24.39l60.19-12.66c1.23-.31-2.78,13.27-3.4,13.89-1.54,3.4-4.32,11.11-8.03,12.04l-68.53,14.82c-.93,0-1.54,0-1.54-1.23v-46.61l-24.69,5.25v31.79c0,6.79-13.27,25-20.06,26.86v-.31L.22,204.4c-1.23.31,3.09-12.96,3.4-13.89ZM196.55,194.83c-1.54,3.09-4.32,11.11-8.33,12.04l-68.84,13.89c-.93.31,3.09-12.96,3.7-13.89,1.54-3.4,4.32-11.11,8.03-12.04l68.84-13.89c1.54-.31-3.09,12.96-3.4,13.89Z"/></svg>`;

function getSmartCurrency(currStr, customClass = "") {
    const c = String(currStr).trim().toLowerCase();
    if (c === 'sr' || c === 'sar') return newRiyalIcon; 
    if (c === 'dollar' || c === 'usd') return `<span class="${customClass}">$</span>`;
    if (c === 'euro' || c === 'eur') return `<span class="${customClass}">€</span>`;
    if (c === 'pound' || c === 'gbp') return `<span class="${customClass}">£</span>`;
    if (c === 'inr' || c === 'rupee') return `<span class="${customClass}">₹</span>`;
    if (c === 'aed') return `<span class="${customClass}">د.إ</span>`;
    return `<span class="${customClass}">${currStr}</span>`; 
}

let activeMenuData = []; 
let mainCategories = []; 
let allSubCategories = []; 
let relatedItemsData = []; 
let selectedMainCategories = new Set(); 
let selectedSubCategories = new Set();  
let searchQuery = '';
let likedItems = new Set(JSON.parse(localStorage.getItem('likedItems')) || []);
let currentOpenItemId = null;
let offerInterval = null;
let currentOfferIndex = 0;
let uiScrollTimeout;
let isGameTriggerEnabled = false;

const staticText = {
    en: { search: 'Search store...', empty: 'No items found.', calories: 'Size/Unit', recipe: 'Nutrition / Ingredients', video: 'Watch Video', call: 'Call to Order', wa: 'WhatsApp', share: 'Share', contact: 'Contact Us', location: 'Location', deliveryPrefix: 'Delivery Charge:', todaySpecial: '🌟 Daily Fresh Offers', all: 'All', specialBadge: "Fresh Offer" },
    ar: { search: 'ابحث في المتجر...', empty: 'لم يتم العثور على عناصر.', calories: 'الحجم/الوحدة', recipe: 'المعلومات الغذائية / المكونات', video: 'شاهد الفيديو', call: 'اتصل للطلب', wa: 'واتساب', share: 'مشاركة', contact: 'اتصل بنا', location: 'الموقع', deliveryPrefix: 'رسوم التوصيل:', todaySpecial: '🌟 عروض اليوم الطازجة', all: 'الكل', specialBadge: "عرض طازج" }
};

async function init() {
    try {
        const fileUrl = "https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/MenuMasterData.json?v=" + new Date().getTime();
        const response = await fetch(fileUrl, { cache: "no-store", pragma: "no-cache" });
        if (!response.ok) throw new Error("Could not fetch JSON file");
        
        const jsonData = await response.json();
        const sNames = Object.keys(jsonData);
        
        const sBrand = sNames.find(n => n.includes("01") || n.includes("Brand") || n.replace(/\s/g,'') === "Sheet1") || sNames[0];
        const sOffer = sNames.find(n => n.includes("2") || n.includes("Offer")) || sNames[1];
        const sMenuEn = sNames.find(n => n.includes("3") || n.includes("English")) || sNames[2];
        const sMenuAr = sNames.find(n => n.includes("4") || n.includes("Arabic")) || sNames[3];
        const sRelated = sNames.find(n => n.toLowerCase().includes("relateditems"));

        if(sBrand && jsonData[sBrand]) {
            window.rawBrandRows = jsonData[sBrand]; 
            rawBranding = window.rawBrandRows.find((r, i) => i > 0 && (r.K || r.B || r.L)) || window.rawBrandRows[1] || window.rawBrandRows[0] || {};
            
            // Language Name Mapping: B2 for English, B3 for Arabic
            rawBranding.nameEn = (window.rawBrandRows[1] && window.rawBrandRows[1].B) ? window.rawBrandRows[1].B : (rawBranding.B || "My Restaurant");
            rawBranding.nameAr = (window.rawBrandRows[2] && window.rawBrandRows[2].B) ? window.rawBrandRows[2].B : rawBranding.nameEn;
        }
        if(sOffer && jsonData[sOffer]) {
            const offerRows = jsonData[sOffer];
            if(offerRows.length > 1) rawOffers = offerRows.slice(1);
        }
        if(sMenuEn && jsonData[sMenuEn]) {
            const enRows = jsonData[sMenuEn];
            if(enRows.length > 1) rawMenuEn = enRows.slice(1);
        }
        if(sMenuAr && jsonData[sMenuAr]) {
            const arRows = jsonData[sMenuAr];
            if(arRows.length > 1) rawMenuAr = arRows.slice(1);
        }
        if(sRelated && Array.isArray(jsonData[sRelated])) {
            relatedItemsData = jsonData[sRelated];
        } else {
            relatedItemsData = [];
        }

        document.getElementById('loading-state').classList.add('hidden');
        applySystemSetup();
        renderSocialMedia();
        
    } catch (error) {
        console.error("JSON Initialization Error:", error);
        document.getElementById('loading-state').classList.add('hidden');
        const errState = document.getElementById('error-state');
        if (errState) {
            errState.classList.remove('hidden');
            errState.classList.add('flex');
        }
    }
}

function applySystemSetup() {
    let langVal = "";
    let langCol = "K";
    for (let col of ["J", "K", "L", "M"]) {
        let val = String(rawBranding[col] || "").trim().toLowerCase();
        if (val === 'english' || val === 'arabic' || val === 'english&arabic' || val === 'both') {
            langVal = val; langCol = col; break;
        }
    }

    if (langCol === "L") {
        rawBranding.smartCurrency = rawBranding.K || "";
        rawBranding.smartSocial = rawBranding.J || "";
        rawBranding.smartDelivery = rawBranding.M || "";
        rawBranding.smartLogo = rawBranding.N || "";
        rawBranding.smartBanner = rawBranding.O || "";
    } else {
        rawBranding.smartCurrency = rawBranding.J || "";
        rawBranding.smartSocial = rawBranding.L || ""; 
        rawBranding.smartDelivery = rawBranding.L || "";
        rawBranding.smartLogo = rawBranding.M || "";
        rawBranding.smartBanner = rawBranding.N || "";
    }

    globalCurrency = rawBranding.smartCurrency;
    const toggleBtn = document.getElementById('lang-toggle-btn');
    
    if(langVal === 'english') {
        langSetup = 'English'; currentLang = 'en';
        toggleBtn.classList.add('hidden'); toggleBtn.classList.remove('flex');
    } else if(langVal === 'arabic') {
        langSetup = 'Arabic'; currentLang = 'ar';
        toggleBtn.classList.add('hidden'); toggleBtn.classList.remove('flex');
    } else {
        langSetup = 'Both'; currentLang = 'en'; 
        toggleBtn.classList.remove('hidden'); toggleBtn.classList.add('flex');
    }
    
    isGameTriggerEnabled = (String(rawBranding.P || "").trim().toLowerCase() === 'true');
    const gameBtn = document.getElementById('game-trigger-btn');
    if (isGameTriggerEnabled && gameBtn) {
        setTimeout(() => {
            if (!uiScrollTimeout) {
                gameBtn.classList.remove('opacity-0', 'pointer-events-none');
                gameBtn.classList.add('opacity-100');
            }
        }, 10000); 
    }

    document.getElementById('lang-text').textContent = currentLang === 'en' ? 'AR' : 'EN';
    processDataForCurrentLang();
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    document.getElementById('lang-text').textContent = currentLang === 'en' ? 'AR' : 'EN';
    closeModal();
    processDataForCurrentLang();
}

function processDataForCurrentLang() {
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    const currentBrandName = currentLang === 'ar' ? (rawBranding.nameAr || rawBranding.B || "مطعمنا") : (rawBranding.nameEn || rawBranding.B || "My Restaurant");

    document.getElementById('nav-title').textContent = currentBrandName;
    document.getElementById('footer-title').textContent = currentBrandName;
    
    const welcomeText = currentLang === 'en' ? "Welcome to" : "مرحباً بكم في";
    document.getElementById('hero-title1').textContent = welcomeText;
    document.getElementById('hero-title2').textContent = currentBrandName;
    
    document.getElementById('f-phone').textContent = rawBranding.C || "--";
    document.getElementById('f-whatsapp').textContent = rawBranding.D || "--";
    
    const emailEl = document.getElementById('f-email');
    emailEl.textContent = rawBranding.F || "--";
    if(rawBranding.F) emailEl.href = "mailto:" + rawBranding.F;

    const mapEl = document.getElementById('f-map-link');
    document.getElementById('f-address').textContent = rawBranding.H || "--";
    if(rawBranding.I) mapEl.href = rawBranding.I;

    if(rawBranding.smartLogo) {
        document.getElementById('default-logo-icon').classList.add('hidden');
        const imgEl = document.getElementById('brand-logo-img');
        imgEl.src = rawBranding.smartLogo;
        imgEl.classList.remove('hidden');
    }

    renderOffers();

    const t = staticText[currentLang];
    document.getElementById('searchInput').placeholder = ''; 
    document.getElementById('empty-text').textContent = t.empty;
    document.getElementById('label-contact').textContent = t.contact;
    document.getElementById('label-location').textContent = t.location;
    
    const rawSource = currentLang === 'en' ? rawMenuEn : rawMenuAr;
    formatMenuData(rawSource);
}

function renderOffers() {
    clearInterval(offerInterval);
    const wrapper = document.getElementById('offer-carousel-wrapper');
    
    if(!rawOffers || rawOffers.length === 0) {
        wrapper.classList.add('hidden'); return;
    }

    wrapper.classList.remove('hidden');
    wrapper.innerHTML = ''; 
    const isRtl = currentLang === 'ar';

    const cards = rawOffers.map((offer) => {
        const card = document.createElement('div');
        let innerOverlayClass = 'bg-black/20 backdrop-blur-sm'; 
        
        if (offer.F) {
            card.style.backgroundImage = `url('${offer.F}')`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';
            innerOverlayClass = 'bg-black/40'; 
        } else {
            card.style.backgroundImage = 'linear-gradient(to right, #f97316, #dc2626)'; 
            innerOverlayClass = ''; 
        }

        card.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full h-full p-4 sm:p-6 ${innerOverlayClass} rounded-2xl">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fas fa-certificate text-yellow-300 animate-pulse"></i>
                    <span class="font-bold text-lg sm:text-xl text-white text-center">${offer.B || ""}</span>
                </div>
                <span class="text-sm sm:text-base font-medium text-red-50 text-center mb-2">${offer.C || ""}</span>
                ${(offer.D || offer.E) ? `
                <div class="flex items-center gap-3 bg-black/40 px-5 py-2 rounded-full border border-white/10 mt-auto">
                    ${offer.D ? `<span class="line-through text-red-200 text-sm font-medium flex items-baseline gap-1">${offer.D} ${getSmartCurrency(globalCurrency, '')}</span>` : ''}
                    ${offer.E ? `<span class="font-extrabold text-2xl text-yellow-300 drop-shadow-md flex items-baseline gap-1">${offer.E} ${getSmartCurrency(globalCurrency, '')}</span>` : ''}
                </div>` : ''}
            </div>
        `;
        wrapper.appendChild(card);
        return card;
    });

    function updatePositions() {
        const total = cards.length;
        cards.forEach((card, index) => {
            let diff = index - currentOfferIndex;
            if (diff < -1) diff += total; 
            if (diff > 1) diff -= total;

            let classes = "absolute w-[85%] sm:w-[65%] max-w-lg transition-all duration-700 ease-in-out rounded-2xl border border-red-400/30 shadow-xl top-2 bottom-2 flex items-center justify-center flex-col overflow-hidden";
            
            if (total === 1) {
                card.className = `${classes} z-30 scale-100 opacity-100 translate-x-0 blur-none`;
                return;
            }

            if (diff === 0) {
                card.className = `${classes} z-30 scale-100 opacity-100 translate-x-0 blur-none`;
            } else if (diff === 1 || (diff < 0 && total === 2 && diff === -1)) {
                const slideClass = isRtl ? '-translate-x-[65%] sm:-translate-x-[85%]' : 'translate-x-[65%] sm:translate-x-[85%]';
                card.className = `${classes} z-20 scale-90 opacity-40 blur-[1px] ${slideClass} cursor-pointer`;
                card.onclick = () => { currentOfferIndex = index; updatePositions(); }; 
            } else if (diff === -1) {
                const slideClass = isRtl ? 'translate-x-[65%] sm:translate-x-[85%]' : '-translate-x-[65%] sm:-translate-x-[85%]';
                card.className = `${classes} z-20 scale-90 opacity-40 blur-[1px] ${slideClass} cursor-pointer`;
                card.onclick = () => { currentOfferIndex = index; updatePositions(); }; 
            } else {
                card.className = `${classes} z-10 scale-75 opacity-0 translate-x-0 pointer-events-none blur-sm`;
            }
        });
    }

    updatePositions();

    let touchStartX = 0;
    let touchEndX = 0;
    let isDraggingOffer = false;

    function handleSwipe() {
        const threshold = 40; 
        if (touchEndX < touchStartX - threshold) {
            currentOfferIndex = isRtl ? (currentOfferIndex - 1 + cards.length) % cards.length : (currentOfferIndex + 1) % cards.length;
            updatePositions();
        } else if (touchEndX > touchStartX + threshold) {
            currentOfferIndex = isRtl ? (currentOfferIndex + 1) % cards.length : (currentOfferIndex - 1 + cards.length) % cards.length;
            updatePositions();
        }
    }

    function startOfferInterval() {
        clearInterval(offerInterval);
        if (cards.length > 1) {
            offerInterval = setInterval(() => {
                currentOfferIndex = (currentOfferIndex + 1) % cards.length;
                updatePositions();
            }, 3000); 
        }
    }

    wrapper.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX; clearInterval(offerInterval); 
    }, {passive: true});

    wrapper.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX; handleSwipe(); startOfferInterval(); 
    }, {passive: true});

    wrapper.addEventListener('mousedown', e => {
        isDraggingOffer = true; touchStartX = e.screenX; clearInterval(offerInterval);
    });
    wrapper.addEventListener('mouseup', e => {
        if(!isDraggingOffer) return;
        isDraggingOffer = false; touchEndX = e.screenX; handleSwipe(); startOfferInterval();
    });
    wrapper.addEventListener('mouseleave', () => {
        if(isDraggingOffer) { isDraggingOffer = false; startOfferInterval(); }
    });

    startOfferInterval(); 
}

function formatMenuData(rawSource) {
    activeMenuData = [];
    mainCategories = [];
    allSubCategories = []; 
    let childrenRows = [];

    rawSource.forEach(row => {
        if(!row.B || !row.D) return;

        const safeId = row.A ? String(row.A).trim() : 'item-' + Math.random().toString(36).substr(2, 9);
        const isVar = String(row.P || "").trim().toLowerCase();
        const isChild = isVar === 'true' || isVar === 'yes';
        const brandLogo = rawBranding.smartLogo || 'https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/logo.png';

        const item = {
            id: safeId,
            catSort: parseInt(row.B) || 999,
            mainCat: String(row.C).trim(),
            subCat: String(row.D || "Other").trim(),
            name: String(row.E).trim(),
            order: parseInt(row.F) || 999, 
            price: parseFloat(row.G) || 0,
            desc: row.H || "",
            calories: row.I || "",
            recipe: row.J || "",
            isTodaySpecial: (() => {
                const badgeVal = String(row.K || "").trim().toLowerCase();
                return badgeVal !== "" && badgeVal !== "false" && badgeVal !== "no";
            })(),
            variants: [],
            imgUrls: (() => {
                let urls = [];
                const v = "?v=" + new Date().getTime(); 
                if (row.L) {
                    urls = String(row.L).split(',').map(u => {
                        let clean = u.trim();
                        if (!clean) return null;
                        if (!clean.startsWith('http')) return `https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/images/ItemImages/${clean}${clean.includes('?') ? '' : v}`;
                        return clean;
                    }).filter(u => u !== null);
                } else {
                    urls.push(brandLogo);
                }
                return [...new Set(urls)];
            })(),
            img: (() => {
                if (row.L) {
                    let first = String(row.L).split(',')[0].trim();
                    return first.startsWith('http') ? first : `https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/images/ItemImages/${first}`;
                }
                return brandLogo;
            })(),
            video: row.M || "",
            reviewLinks: row.N || "",
            flashCards: row.O || "" 
        };

        if (isChild) {
            childrenRows.push(item);
        } else {
            activeMenuData.push(item);
            if(!mainCategories.includes(item.mainCat)) mainCategories.push(item.mainCat);
            if(!allSubCategories.includes(item.subCat)) allSubCategories.push(item.subCat);
        }
    });

    childrenRows.forEach(child => {
        const parent = activeMenuData.find(p => String(p.id) === String(child.id));
        if (parent) {
            if (parent.variants.length === 0) {
                parent.variants.push({
                    variantId: parent.id + '-default',
                    name: parent.name,
                    price: parent.price,
                    size: parent.calories
                });
            }
            parent.variants.push({
                variantId: child.id + '-' + Math.random().toString(36).substr(2, 5),
                name: child.name,
                price: child.price,
                size: child.calories
            });
        }
    });

    const categoryMap = {};
    activeMenuData.forEach(item => {
        if (!categoryMap[item.mainCat] || item.catSort < categoryMap[item.mainCat]) {
            categoryMap[item.mainCat] = item.catSort;
        }
    });
    mainCategories.sort((a, b) => categoryMap[a] - categoryMap[b]);

    renderCategoryFilters();
    renderSubCategoryFilters();
    executeFilter();
    animateSearchPlaceholder();
}

function getCategoryIcon(catName) {
    const lower = catName.toLowerCase();
    if(lower.includes('produce') || lower.includes('fresh') || lower.includes('خضار') || lower.includes('فواكه')) return 'fa-apple-alt';
    if(lower.includes('dairy') || lower.includes('milk') || lower.includes('ألبان') || lower.includes('حليب')) return 'fa-cheese';
    if(lower.includes('bakery') || lower.includes('bread') || lower.includes('مخبوزات') || lower.includes('خبز')) return 'fa-bread-slice';
    if(lower.includes('meat') || lower.includes('لحوم') || lower.includes('دجاج')) return 'fa-drumstick-bite';
    if(lower.includes('seafood') || lower.includes('fish') || lower.includes('أسماك') || lower.includes('بحريات')) return 'fa-fish';
    if(lower.includes('drink') || lower.includes('beverage') || lower.includes('مشروب') || lower.includes('عصير')) return 'fa-glass-cheers';
    if(lower.includes('snack') || lower.includes('تسالي') || lower.includes('سناك')) return 'fa-cookie';
    if(lower.includes('pantry') || lower.includes('grocery') || lower.includes('بقالة') || lower.includes('معلبات')) return 'fa-box-open';
    if(lower.includes('household') || lower.includes('cleaning') || lower.includes('منظفات')) return 'fa-spray-can';
    return 'fa-shopping-basket'; 
}

function renderCategoryFilters() {
    const row1 = document.getElementById('category-row-1');
    const row2 = document.getElementById('category-row-2');
    row1.innerHTML = ''; row2.innerHTML = '';
    
    const t = staticText[currentLang];
    const activeClass = 'bg-red-500 text-white border-red-500 shadow-sm z-10';
    const inactiveClass = 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-500';
    const allCats = ['All', ...mainCategories];

    allCats.forEach((cat, index) => {
        const isAll = cat === 'All';
        const isActive = isAll ? selectedMainCategories.size === 0 : selectedMainCategories.has(cat);
        const icon = isAll ? 'fa-th-large' : getCategoryIcon(cat);
        const label = isAll ? t.all : cat;

        const btn = document.createElement('button');
        btn.className = `w-[calc(25vw-9px)] sm:w-[120px] shrink-0 snap-start flex flex-col items-center justify-center gap-1 whitespace-nowrap p-1.5 rounded-xl border font-bold text-[10px] leading-tight transition-colors ${isActive ? activeClass : inactiveClass}`;
        btn.innerHTML = `<i class="fas ${icon} text-sm ${isActive ? 'text-white' : 'text-red-400'}"></i> <span class="truncate w-full text-center">${label}</span>`;
        
        btn.onclick = () => { 
            if (isAll) { selectedMainCategories.clear(); selectedSubCategories.clear(); } 
            else { if (selectedMainCategories.has(cat)) selectedMainCategories.delete(cat); else selectedMainCategories.add(cat); }
            renderCategoryFilters(); renderSubCategoryFilters(); executeFilter(); 
            const menuTop = document.getElementById('menu-container').getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: menuTop - 190, behavior: 'smooth' });
        };
        
        const posInBlock = index % 8;
        if (posInBlock < 4) { row1.appendChild(btn); } else { row2.appendChild(btn); }
    });
    setupDraggable('main-category-wrapper'); 
}

function renderSubCategoryFilters() {
    const container = document.getElementById('sub-category-filters');
    container.innerHTML = '';
    const activeClass = 'bg-gray-800 text-white border-gray-800 shadow-sm';
    const inactiveClass = 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100';

    let relevantSubCats = new Set();
    if (selectedMainCategories.size === 0) {
        allSubCategories.forEach(sub => relevantSubCats.add(sub));
    } else {
        activeMenuData.forEach(item => { if (selectedMainCategories.has(item.mainCat)) relevantSubCats.add(item.subCat); });
    }

    selectedSubCategories.forEach(sub => { if (!relevantSubCats.has(sub)) selectedSubCategories.delete(sub); });

    Array.from(relevantSubCats).sort().forEach(subCat => {
        const btn = document.createElement('button');
        const isActive = selectedSubCategories.has(subCat);
        const safeId = subCat.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        btn.id = 'sub-btn-' + safeId;
        btn.className = `shrink-0 px-3 py-1 rounded-full border text-xs font-bold transition-colors ${isActive ? activeClass : inactiveClass}`;
        btn.textContent = subCat;
        btn.onclick = () => {
            if (selectedSubCategories.has(subCat)) selectedSubCategories.delete(subCat);
            else selectedSubCategories.add(subCat);
            renderSubCategoryFilters(); executeFilter();
            const menuTop = document.getElementById('menu-container').getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: menuTop - 190, behavior: 'smooth' });
        };
        container.appendChild(btn);
    });
    setupDraggable('sub-category-filters');
}

function setupDraggable(elementOrId) {
    const slider = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if(!slider) return;
    if (slider.dataset.dragAttached === "true") return;
    slider.dataset.dragAttached = "true";
    let isDown = false; let startX; let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true; slider.classList.add('cursor-grabbing');
        slider.style.scrollSnapType = 'none'; 
        startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false; slider.classList.remove('cursor-grabbing'); slider.style.scrollSnapType = ''; 
    });
    slider.addEventListener('mouseup', () => {
        isDown = false; slider.classList.remove('cursor-grabbing'); slider.style.scrollSnapType = ''; 
    });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return; e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; 
        slider.scrollLeft = scrollLeft - walk;
    });
}

let isMainCatOpen = true; 
let touchStartY = 0; let touchEndY = 0; let lastScrollY = window.scrollY; 
let menuOpenScrollY = 0; let ignoreScrollUntil = 0; 

function toggleMainCategories(forceState) {
    const container = document.getElementById('main-category-container');
    const icon = document.getElementById('category-toggle-icon');
    if (forceState !== undefined) { isMainCatOpen = forceState; } else { isMainCatOpen = !isMainCatOpen; }

    if (isMainCatOpen) {
        ignoreScrollUntil = Date.now() + 800; menuOpenScrollY = window.scrollY; 
        container.classList.remove('max-h-0', 'opacity-0'); container.classList.add('max-h-[300px]', 'opacity-100');
        if (icon) { icon.classList.remove('fa-chevron-down', 'text-gray-500'); icon.classList.add('fa-chevron-up', 'text-red-400'); }
    } else {
        container.classList.add('max-h-0', 'opacity-0'); container.classList.remove('max-h-[300px]', 'opacity-100');
        if (icon) { icon.classList.remove('fa-chevron-up', 'text-red-400'); icon.classList.add('fa-chevron-down', 'text-gray-500'); }
    }
}

const island = document.getElementById('filter-header-island');
if (island) {
    island.addEventListener('touchstart', e => { touchStartY = e.changedTouches[0].screenY; }, {passive: true});
    island.addEventListener('touchend', e => {
        touchEndY = e.changedTouches[0].screenY;
        if (touchEndY > touchStartY + 30) { toggleMainCategories(true); } else if (touchEndY < touchStartY - 30) { toggleMainCategories(false); }
    }, {passive: true});
}

let hasPassedHeader = false;
let autoCloseTimeout; 

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY; const hideThreshold = 150; 
    if (currentScrollY > hideThreshold && !hasPassedHeader) {
        hasPassedHeader = true; if (isMainCatOpen) toggleMainCategories(false);
    } else if (currentScrollY <= hideThreshold && hasPassedHeader) {
        hasPassedHeader = false; if (!isMainCatOpen) toggleMainCategories(true);
    }
    if (hasPassedHeader && isMainCatOpen) {
        if (Date.now() > ignoreScrollUntil) {
            if (Math.abs(currentScrollY - menuOpenScrollY) > 50) {
                clearTimeout(autoCloseTimeout);
                autoCloseTimeout = setTimeout(() => { if (isMainCatOpen) toggleMainCategories(false); }, 200); 
            }
        } else { menuOpenScrollY = currentScrollY; }
    }

    const sections = document.querySelectorAll('.menu-section-tracker');
    let currentActiveSectionId = null;
    sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 180 && rect.bottom >= 180) { currentActiveSectionId = sec.id.replace('section-', ''); }
    });

    if (currentActiveSectionId) {
        const activeBtn = document.getElementById('sub-btn-' + currentActiveSectionId);
        const subContainer = document.getElementById('sub-category-filters');
        if (activeBtn && subContainer) {
            subContainer.scrollTo({ left: activeBtn.offsetLeft - 10, behavior: 'smooth' });
        }
    }

    const backToTopBtn = document.getElementById('back-to-top-btn');
    const gameBtn = document.getElementById('game-trigger-btn');
    if (backToTopBtn) { backToTopBtn.classList.add('opacity-0', 'pointer-events-none'); backToTopBtn.classList.remove('opacity-100'); }
    if (gameBtn && isGameTriggerEnabled) { gameBtn.classList.add('opacity-0', 'pointer-events-none'); gameBtn.classList.remove('opacity-100'); }

    clearTimeout(uiScrollTimeout);
    uiScrollTimeout = setTimeout(() => {
        const totalPageHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = (currentScrollY / totalPageHeight) * 100;
        if (backToTopBtn && scrollPercentage >= 50) { backToTopBtn.classList.remove('opacity-0', 'pointer-events-none'); backToTopBtn.classList.add('opacity-100'); }
        if (gameBtn && isGameTriggerEnabled) { gameBtn.classList.remove('opacity-0', 'pointer-events-none'); gameBtn.classList.add('opacity-100'); }
        uiScrollTimeout = null;
    }, 1000); 
}, {passive: true});

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

/* ==========================================================
   PART 2: MENU RENDERING, MODALS & WHATSAPP LOGIC
   ========================================================== */

function executeFilter() {
    const container = document.getElementById('menu-container');
    const emptyState = document.getElementById('empty-state');
    container.innerHTML = ''; let hasItems = false;
    let filteredData = activeMenuData;
    
    if (selectedMainCategories.size > 0) { filteredData = filteredData.filter(i => selectedMainCategories.has(i.mainCat)); }
    if (selectedSubCategories.size > 0) { filteredData = filteredData.filter(i => selectedSubCategories.has(i.subCat)); }
    if (searchQuery) {
        const searchWords = searchQuery.toLowerCase().split(' ').filter(word => word.trim() !== '');
        filteredData = filteredData.filter(i => {
            const searchableText = `${i.name} ${i.desc} ${i.mainCat} ${i.subCat}`.toLowerCase();
            return searchWords.every(word => searchableText.includes(word));
        });
    }

    if (selectedMainCategories.size === 0 && selectedSubCategories.size === 0 && !searchQuery) {
        const specials = activeMenuData.filter(i => i.isTodaySpecial);
        if (specials.length > 0) {
            hasItems = true; specials.sort((a, b) => a.order - b.order);
            renderSection(staticText[currentLang].todaySpecial, specials, container, true);
        }
    }

    const grouped = {};
    filteredData.forEach(item => {
        if(!grouped[item.subCat]) grouped[item.subCat] = []; grouped[item.subCat].push(item);
    });

    let categoryCount = 0; 
    for (const subCat in grouped) {
        hasItems = true; const items = grouped[subCat]; items.sort((a, b) => a.order - b.order);
        renderSection(subCat, items, container, false);
        categoryCount++;

        if (window.rawBrandRows && window.rawBrandRows.length > categoryCount) {
            const rowData = window.rawBrandRows[categoryCount];
            const cellValue = rowData['O'] || rowData['N']; 
            if (cellValue) {
                const bannerUrls = String(cellValue).split(',').map(u => {
                    let clean = u.trim(); if (!clean) return null;
                    if (!clean.startsWith('http')) { return `https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/images/banner/${clean}`; }
                    return clean; 
                }).filter(u => u !== null);

                if (bannerUrls.length > 0) {
                    const bannerDiv = document.createElement('div');
                    bannerDiv.className = "w-full aspect-[3/1] rounded-2xl overflow-hidden shadow-md relative mb-6 group";
                    let imagesHtml = '';
                    bannerUrls.forEach(url => { imagesHtml += `<img src="${url}" class="w-full h-full object-cover shrink-0 snap-center" onerror="this.remove()">`; });
                    if (bannerUrls.length > 1) { imagesHtml += `<img src="${bannerUrls[0]}" class="w-full h-full object-cover shrink-0 snap-center" data-is-clone="true" onerror="this.remove()">`; }
                    
                    const sliderId = 'banner-slider-' + categoryCount;
                    
                    let arrowsHtml = '';
                    if (bannerUrls.length > 1) {
                        arrowsHtml = `
                            <button onclick="const s=document.getElementById('${sliderId}'); s.scrollBy({left: -s.clientWidth, behavior:'smooth'});" class="absolute top-1/2 start-2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-10 shadow-md">
                                <i class="fas fa-chevron-left text-xs"></i>
                            </button>
                            <button onclick="const s=document.getElementById('${sliderId}'); s.scrollBy({left: s.clientWidth, behavior:'smooth'});" class="absolute top-1/2 end-2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-10 shadow-md">
                                <i class="fas fa-chevron-right text-xs"></i>
                            </button>
                        `;
                    }

                    bannerDiv.innerHTML = `
                        <div id="${sliderId}" class="excel-banner-slider flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar" style="scroll-behavior: smooth;">${imagesHtml}</div>
                        ${arrowsHtml}
                    `;
                    container.appendChild(bannerDiv);
                }
            }
        }
    }

    if (!hasItems) { container.classList.add('hidden'); emptyState.classList.remove('hidden'); } 
    else { container.classList.remove('hidden'); container.classList.add('flex'); emptyState.classList.add('hidden'); }
    
    updateQuickAddButtons(); 
    gatherFlashCards(); 
}

function renderSection(title, items, container, isHighlight) {
    const section = document.createElement('div');
    const safeId = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    section.className = 'menu-section-tracker'; section.id = 'section-' + safeId;
    
    const headerClasses = isHighlight ? "text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500" : "text-xl font-bold text-gray-800";
    const titleWrapper = document.createElement('div');
    titleWrapper.className = "flex items-center justify-between border-b-2 border-red-100 pb-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity group";
    titleWrapper.onclick = () => openCategoryPage(title, isHighlight);
    const arrowIcon = currentLang === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right';
    
    titleWrapper.innerHTML = `<h3 class="${headerClasses}">${title}</h3><div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors shadow-sm"><i class="fas ${arrowIcon} text-sm"></i></div>`;
    section.appendChild(titleWrapper);
    
    const grid = document.createElement('div');
    if (isHighlight) {
        const rowClass = items.length > 20 ? 'grid-rows-2' : 'grid-rows-1';
        grid.className = `highlight-auto-scroll grid ${rowClass} grid-flow-col gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory`;
    } else { grid.className = "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6"; }

    items.forEach((item, index) => {
        const delay = index * 30; const card = document.createElement('div');
        const bgClass = item.isTodaySpecial ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-gray-100';
        let cardClasses = `menu-card ${bgClass} rounded-2xl overflow-hidden border shadow-sm flex flex-col h-full opacity-0 translate-y-4 relative group`;
        
        if (isHighlight) { cardClasses += ' w-[40vw] sm:w-[220px] snap-start shrink-0'; } 
        else { if (index === items.length - 1 && items.length % 2 !== 0) { cardClasses += ' col-span-2 md:col-span-1'; } }
        
        card.className = cardClasses; card.style.animation = `fadeInUp 0.4s ease forwards ${delay}ms`;
        card.onclick = () => openModal(item.id);

        const isLiked = likedItems.has(item.id);
        let cardCurrencyDisplay = getSmartCurrency(globalCurrency, "text-[10px] sm:text-xs font-normal mx-0.5 text-gray-500");
        const priceHtml = currentLang === 'en' ? `<span class="flex items-baseline">${cardCurrencyDisplay}<span>${item.price}</span></span>` : `<span class="flex items-baseline"><span>${item.price}</span>${cardCurrencyDisplay}</span>`;

        let badgeHtml = '';
        if(item.isTodaySpecial) badgeHtml = `<div class="absolute top-2 end-2 bg-gradient-to-r from-orange-400 to-red-500 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold text-white shadow-sm z-10"><i class="fas fa-star text-[10px]"></i> Special</div>`;
        else if(item.video) badgeHtml = `<div class="absolute top-2 end-2 bg-black/70 backdrop-blur px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold text-white shadow-sm flex items-center gap-1 z-10"><i class="fas fa-play"></i> Video</div>`;

        const urls = item.imgUrls || [item.img]; let imagesHtml = '';
        urls.forEach(url => { imagesHtml += `<img src="${url}" alt="Image" class="w-full h-full object-cover shrink-0 snap-center group-hover:scale-105 transition-transform duration-500" onerror="if(this.src.includes('.jpg')) { this.src=this.src.replace('.jpg', '.png'); } else if(this.src.includes('.png')) { this.src=this.src.replace('.png', '.jpeg'); } else { if(this.parentElement && this.parentElement.children.length > 1) { this.remove(); } else { this.onerror=null; this.classList.replace('object-cover', 'object-contain'); this.classList.add('p-4'); this.src='${rawBranding.smartLogo || 'https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/logo.png'}'; } }">`; });
        if (urls.length > 1) { imagesHtml += `<img src="${urls[0]}" data-is-clone="true" alt="Image Clone" class="w-full h-full object-cover shrink-0 snap-center group-hover:scale-105 transition-transform duration-500">`; }

        card.innerHTML = `
            <button onclick="toggleLike(event, '${item.id}')" class="absolute top-2 start-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm z-20 text-sm">
                <i class="${isLiked ? 'fas text-red-500' : 'far'} fa-heart"></i>
            </button>
            <div class="relative aspect-[4/3] overflow-hidden shrink-0 bg-gray-100 rounded-t-2xl">
                <div class="mini-img-slider mini-slider-${item.id} flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar" style="scroll-behavior: smooth;" data-img-count="${urls.length}">
                    ${imagesHtml}
                </div>
                ${badgeHtml}
            </div>
            <div class="p-3 sm:p-4 flex flex-col flex-grow">
                <div class="flex justify-between items-start mb-1 sm:mb-2 gap-2">
                    <h4 class="text-sm sm:text-base font-bold text-gray-900 leading-tight">${item.name}</h4>
                    <span class="font-extrabold text-red-600 whitespace-nowrap text-sm sm:text-base shrink-0">${priceHtml}</span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2 mt-1 mb-2 flex-grow">${item.desc}</p>
                <div class="flex justify-between items-end mt-1">
                    ${item.calories ? `<div class="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md"><i class="fas fa-weight-hanging"></i> ${item.calories}</div>` : '<div></div>'}
                    ${item.variants && item.variants.length > 0 
                        ? `<button onclick="event.stopPropagation(); openModal('${item.id}')" class="bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md hover:bg-green-600 transition-colors pointer-events-auto">Options</button>` 
                        : `<div class="stepper-container-${item.id} flex items-center h-8" onclick="event.stopPropagation();"></div>`
                    }
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    section.appendChild(grid); container.appendChild(section);
    
    if (isHighlight) {
        setupDraggable(grid);
    }
}

function openModal(id) {
    const item = activeMenuData.find(i => String(i.id) === String(id));
    if (!item) return; currentOpenItemId = id;
    const t = staticText[currentLang];

    const slider = document.getElementById('modal-image-slider');
    const dots = document.getElementById('modal-image-dots');
    slider.innerHTML = ''; dots.innerHTML = '';

    const urls = item.imgUrls || [item.img];
    urls.forEach((url, i) => {
        const imgHtml = `<img src="${url}" class="w-full h-full object-cover shrink-0 snap-center" onerror="if(this.src.includes('.jpg')) { this.src=this.src.replace('.jpg', '.png'); } else if(this.src.includes('.png')) { this.src=this.src.replace('.png', '.jpeg'); } else { if(this.parentElement && this.parentElement.children.length > 1) { this.remove(); let d = document.getElementById('dot-${i}'); if(d) d.remove(); } else { this.onerror=null; this.classList.replace('object-cover', 'object-contain'); this.classList.add('p-8'); this.src='${rawBranding.smartLogo || 'https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/logo.png'}'; } }">`;
        slider.insertAdjacentHTML('beforeend', imgHtml);
        dots.insertAdjacentHTML('beforeend', `<div id="dot-${i}" class="modal-dot w-2 h-2 rounded-full transition-all duration-300 ${i===0 ? 'bg-red-500 scale-125' : 'bg-white/80 shadow-sm'}"></div>`);
    });

    clearInterval(window.modalCarouselTimer);
    const realImgCount = urls.length;
    if (realImgCount > 1) { slider.insertAdjacentHTML('beforeend', `<img src="${urls[0]}" data-is-clone="true" class="w-full h-full object-cover shrink-0 snap-center">`); }
    
    slider.onscroll = () => {
        if (realImgCount <= 1) { dots.style.display = 'none'; return; }
        dots.style.display = 'flex';
        let currentIdx = Math.round(Math.abs(slider.scrollLeft) / slider.clientWidth);
        if (currentIdx >= realImgCount) currentIdx = 0;
        const remainingDots = dots.querySelectorAll('.modal-dot');
        remainingDots.forEach((dot, k) => { dot.className = `modal-dot w-2 h-2 rounded-full transition-all duration-300 ${k===currentIdx ? 'bg-red-500 scale-125' : 'bg-white/80 shadow-sm'}`; });
    };

    window.modalCarouselTimer = setInterval(() => {
        if (Date.now() - lastSliderInteraction < 5000) return;
        if (realImgCount <= 1) return;
        const isRTL = document.documentElement.dir === 'rtl';
        let currentPos = Math.abs(slider.scrollLeft);
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        if (currentPos >= maxScroll - 5) { slider.scrollLeft = 0; currentPos = 0; }
        slider.scrollTo({ left: isRTL ? -(currentPos + slider.clientWidth) : (currentPos + slider.clientWidth), behavior: 'smooth' });
    }, 3000);

    document.getElementById('modalCategoryBadge').textContent = item.subCat;
    document.getElementById('modalTitle').textContent = item.name;
    document.getElementById('modalDesc').textContent = item.desc;
    
    const specialBadge = document.getElementById('modalTodaySpecialBadge');
    if(item.isTodaySpecial) { specialBadge.classList.remove('hidden'); document.getElementById('label-modal-special').textContent = t.specialBadge; } 
    else { specialBadge.classList.add('hidden'); }
    
    document.getElementById('label-calories').textContent = t.calories;
    document.getElementById('label-recipe').textContent = t.recipe;
    document.getElementById('label-video').textContent = t.video;
    document.getElementById('label-call').textContent = t.call;
    document.getElementById('label-wa').textContent = t.wa;
    document.getElementById('label-share').textContent = t.share;

    const delCharge = rawBranding.smartDelivery ? `${rawBranding.smartDelivery}` : 'Free';
    document.getElementById('modalDeliveryText').textContent = `${t.deliveryPrefix} ${delCharge}`;

    let modalCurrencyDisplay = getSmartCurrency(globalCurrency, "text-sm md:text-base font-normal mx-1 text-red-400");
    const priceHtml = currentLang === 'en' ? `<span class="text-red-400 flex items-baseline justify-end">${modalCurrencyDisplay}<span class="text-3xl text-red-500">${item.price}</span></span>` : `<span class="text-red-400 flex items-baseline justify-end"><span class="text-3xl text-red-500">${item.price}</span>${modalCurrencyDisplay}</span>`;
    document.getElementById('modalPrice').innerHTML = priceHtml;

    if(item.calories) { document.getElementById('modalCalories').textContent = item.calories; document.getElementById('modalCalories').parentElement.classList.remove('hidden'); document.getElementById('modalCalories').parentElement.classList.add('inline-flex'); } 
    else { document.getElementById('modalCalories').parentElement.classList.add('hidden'); document.getElementById('modalCalories').parentElement.classList.remove('inline-flex'); }

    const oldVariantArea = document.getElementById('modalVariantArea');
    if (oldVariantArea) oldVariantArea.remove();
    
    const recipeArea = document.getElementById('modalRecipeArea');
    
    if (item.variants && item.variants.length > 0) {
        let variantHtml = `<div id="modalVariantArea" class="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <h4 class="font-bold text-sm text-gray-800 mb-2">Select Size / Option:</h4>
            <div class="flex flex-col gap-2" id="variant-list-container"></div>
        </div>`;
        
        recipeArea.insertAdjacentHTML('beforebegin', variantHtml);
        
        window.renderModalVariants = function() {
            const listContainer = document.getElementById('variant-list-container');
            if(!listContainer) return;
            listContainer.innerHTML = '';
            
            item.variants.forEach(v => {
                const cartItem = cart.find(c => c.id === v.variantId);
                const qty = cartItem ? cartItem.qty : 0;
                listContainer.innerHTML += `
                    <div class="flex justify-between items-center bg-white p-2 rounded-lg border ${qty > 0 ? 'border-green-500' : 'border-gray-200'}">
                        <div>
                            <div class="font-bold text-sm text-gray-900">${v.size || v.name}</div>
                            <div class="text-xs text-red-500 font-bold">${v.price} ${globalCurrency}</div>
                        </div>
                        <div class="flex items-center h-8">
                            ${qty > 0 ? `
                                <div class="flex items-center bg-green-50 rounded-full border border-green-500 overflow-hidden shadow-sm h-full">
                                    <button onclick="changeQty('${v.variantId}', -1); window.renderModalVariants();" class="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-200 transition"><i class="fas ${qty === 1 ? 'fa-trash-alt text-[10px]' : 'fa-minus text-xs'}"></i></button>
                                    <span class="font-bold text-sm w-4 text-center text-green-800">${qty}</span>
                                    <button onclick="changeQty('${v.variantId}', 1); window.renderModalVariants();" class="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-200 transition"><i class="fas fa-plus text-xs"></i></button>
                                </div>
                            ` : `
                                <button onclick="addVariantToCart('${item.id}', '${v.variantId}'); window.renderModalVariants();" class="bg-green-500 text-white px-4 h-full rounded-full text-xs font-bold shadow-md hover:bg-green-600 transition">Add</button>
                            `}
                        </div>
                    </div>
                `;
            });
        };
            window.renderModalVariants();
        }
    if(item.recipe) {
        document.getElementById('modalRecipe').textContent = item.recipe; recipeArea.classList.remove('hidden'); window.toggleRecipe(true); 
        setTimeout(() => {
            const p = document.getElementById('modalRecipe');
            if (p.scrollHeight <= p.clientHeight + 5) { document.getElementById('recipeFade').classList.add('hidden'); document.getElementById('recipeToggleText').classList.add('hidden'); p.classList.remove('line-clamp-2'); } 
            else { document.getElementById('recipeToggleText').classList.remove('hidden'); }
        }, 50);
    } else { recipeArea.classList.add('hidden'); }

    const vidBtn = document.getElementById('modalVideoBtn');
    if(item.video) { vidBtn.href = item.video; vidBtn.classList.remove('hidden'); } 
    else { vidBtn.classList.add('hidden'); }

    const reviewArea = document.getElementById('modalReviewArea');
    const reviewIconsContainer = document.getElementById('modalReviewIcons');
    reviewIconsContainer.innerHTML = ''; 

    if (item.reviewLinks) {
        const links = String(item.reviewLinks).split(',').map(l => l.trim());
        const platforms = [
            { name: 'instagram', icon: 'fab fa-instagram', hover: 'hover:bg-pink-600', color: 'text-pink-600' },
            { name: 'facebook', icon: 'fab fa-facebook-f', hover: 'hover:bg-blue-600', color: 'text-blue-600' },
            { name: 'snapchat', icon: 'fab fa-snapchat-ghost', hover: 'hover:bg-yellow-500 hover:text-black', color: 'text-yellow-500' },
            { name: 'tiktok', icon: 'fab fa-tiktok', hover: 'hover:bg-gray-700', color: 'text-gray-700' },
            { name: 'youtube', icon: 'fab fa-youtube', hover: 'hover:bg-red-600', color: 'text-red-600' }
        ];

        links.forEach(link => {
            if (!link) return;
            const lowerLink = link.toLowerCase(); 
            let matchedPlatform = platforms.find(p => lowerLink.includes(p.name)) || { name: 'google' };
            const a = document.createElement('a'); a.href = lowerLink.startsWith('http') ? link : `https://${link}`; a.target = '_blank';
            if (matchedPlatform.name === 'google') {
                a.className = `h-10 px-4 rounded-full border border-gray-200 bg-white flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50 shadow-sm`;
                a.innerHTML = `<i class="fab fa-google text-blue-500 text-lg"></i><span class="font-bold text-gray-700 text-sm">Reviews</span><div class="flex text-yellow-400 text-xs gap-0.5"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>`;
            } else {
                a.className = `w-10 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center ${matchedPlatform.color} transition-all duration-300 ${matchedPlatform.hover} hover:text-white shadow-sm`;
                a.innerHTML = `<i class="${matchedPlatform.icon}"></i>`;
            }
            reviewIconsContainer.appendChild(a);
        });
        reviewArea.classList.remove('hidden'); reviewArea.classList.add('flex');
    } else { reviewArea.classList.add('hidden'); reviewArea.classList.remove('flex'); }

    const relatedArea = document.getElementById('modalRelatedArea');
    const relatedSlider = document.getElementById('related-slider');
    relatedSlider.innerHTML = '';
    
    const relatedRow = relatedItemsData.find(row => String(row['C']).trim() === String(item.id).trim());
    
    if (relatedRow) {
        let relatedIDs = [];
        ['D','E','F','G','H','I','J','K','L','M'].forEach(col => { if (relatedRow[col]) relatedIDs.push(String(relatedRow[col]).trim()); });
        const matchedItems = activeMenuData.filter(menuItem => relatedIDs.includes(String(menuItem.id))).slice(0, 10);

        if (matchedItems.length > 0) {
            matchedItems.forEach(relItem => {
                const isVar = relItem.variants && relItem.variants.length > 0;
                
                const actionBtn = isVar 
                    ? `<button type="button" onclick="event.stopPropagation(); openModal('${relItem.id}')" class="bg-blue-500 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-sm hover:bg-blue-600 transition-colors pointer-events-auto z-10 relative">Options</button>`
                    : `<button type="button" onclick="event.stopPropagation(); toggleQuickCart('${relItem.id}')" class="quick-add-btn-${relItem.id} bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-colors pointer-events-auto z-10 relative"><i class="quick-add-icon-${relItem.id} fas fa-plus text-[8px] transition-transform duration-500 pointer-events-none"></i></button>`;

                relatedSlider.innerHTML += `
                    <div class="relative w-[28vw] sm:w-[110px] flex-shrink-0 snap-start bg-green-50 border border-green-100 rounded-xl p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow group">
                        <div onclick="openModal('${relItem.id}')">
                            <img src="${relItem.img}" class="w-full h-16 object-cover rounded-lg mb-1.5 pointer-events-none" onerror="if(this.src.includes('.jpg')) { this.src=this.src.replace('.jpg', '.png'); } else if(this.src.includes('.png')) { this.src=this.src.replace('.png', '.jpeg'); } else { this.onerror=null; this.src='${rawBranding.smartLogo || 'https://raw.githubusercontent.com/DigiDatas/ShawarMax-Menu/main/logo.png'}'; }">
                            <h4 class="text-[10px] font-bold text-gray-800 line-clamp-1 pointer-events-none">${relItem.name}</h4>
                        </div>
                        <div class="flex justify-between items-center mt-1 pointer-events-none">
                            <p class="text-[10px] text-green-700 font-bold flex items-baseline gap-1">${getSmartCurrency(globalCurrency, '')} <span>${relItem.price}</span></p>
                            ${actionBtn}
                        </div>
                    </div>
                `;
            });
            relatedArea.classList.remove('hidden'); relatedArea.classList.add('flex');
            setupDraggable('related-slider'); 
        } else { relatedArea.classList.add('hidden'); relatedArea.classList.remove('flex'); }
    } else { relatedArea.classList.add('hidden'); relatedArea.classList.remove('flex'); }

    updateQuickAddButtons(); 

    const modal = document.getElementById('productModal');
    const backdrop = document.getElementById('modalBackdrop');
    const content = document.getElementById('modalContent');
    
    modal.classList.remove('hidden'); modal.classList.add('flex'); void modal.offsetWidth; 
    backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100');
    content.classList.remove('translate-y-full', 'md:scale-95', 'opacity-0'); content.classList.add('translate-y-0', 'md:scale-100', 'opacity-100');
    document.body.style.overflow = 'hidden';

    const actionFooter = document.getElementById('modal-action-footer');
    const scrollArea = actionFooter.parentElement;
    actionFooter.classList.add('sticky', 'bottom-0', 'bg-white', 'z-20', 'shadow-[0_-15px_20px_-15px_rgba(0,0,0,0.15)]', 'pb-4');
    function releaseSticky() {
        actionFooter.classList.remove('sticky', 'bottom-0', 'bg-white', 'z-20', 'shadow-[0_-15px_20px_-15px_rgba(0,0,0,0.15)]', 'pb-4');
        scrollArea.removeEventListener('scroll', releaseSticky); scrollArea.removeEventListener('touchmove', releaseSticky);
    }
    scrollArea.addEventListener('scroll', releaseSticky, {once: true}); scrollArea.addEventListener('touchmove', releaseSticky, {once: true});
}

function closeModal() {
    currentOpenItemId = null;
    const modal = document.getElementById('productModal'); const backdrop = document.getElementById('modalBackdrop'); const content = document.getElementById('modalContent');
    backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
    content.classList.remove('translate-y-0', 'md:scale-100', 'opacity-100'); content.classList.add('translate-y-full', 'md:scale-95', 'opacity-0');
    document.body.style.overflow = '';
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 300); 
}

function toggleLike(event, id) {
    event.stopPropagation(); const icon = event.currentTarget.querySelector('i');
    if (likedItems.has(id)) { likedItems.delete(id); icon.classList.replace('fas', 'far'); icon.classList.remove('text-red-500'); } 
    else { likedItems.add(id); icon.classList.replace('far', 'fas'); icon.classList.add('text-red-500'); }
    localStorage.setItem('likedItems', JSON.stringify([...likedItems]));
}

function callPhone() { if(rawBranding.C) window.location.href = `tel:${rawBranding.C}`; }

function openWhatsApp() {
    if(rawBranding.D) {
        let phone = String(rawBranding.D).replace(/\D/g, '');
        let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        let waUrl = isMobile ? `whatsapp://send?phone=${phone}` : `https://web.whatsapp.com/send?phone=${phone}`;
        let link = document.createElement('a'); link.href = waUrl; link.target = '_blank';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
}

function openWhatsAppItem() {
    if(!currentOpenItemId || !rawBranding.D) return;
    const item = activeMenuData.find(i => String(i.id) === String(currentOpenItemId));
    if(!item) return;
    const text = currentLang === 'en' ? `Hi, I would like to order: ${item.name} (${item.price} ${globalCurrency})` : `مرحباً، أود طلب: ${item.name} (${item.price} ${globalCurrency})`;
    let phone = String(rawBranding.D).replace(/\D/g, '');
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let waUrl = isMobile ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}` : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
    let link = document.createElement('a'); link.href = waUrl; link.target = '_blank';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function sendOrderViaWhatsApp() {
    if(cart.length === 0 || !rawBranding.D) return;
    
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const phoneError = document.getElementById('phone-error-msg');

    nameInput.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
    phoneInput.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
    phoneError.classList.add('hidden');

    const custName = nameInput.value.trim();
    const custPhone = phoneInput.value.trim();

    if (custName.length < 3) {
        nameInput.classList.add('border-red-500', 'ring-2', 'ring-red-200', 'animate-shake');
        nameInput.focus();
        setTimeout(() => nameInput.classList.remove('animate-shake'), 400);
        return;
    }

    if (custPhone.length !== 10) {
        phoneInput.classList.add('border-red-500', 'ring-2', 'ring-red-200', 'animate-shake');
        phoneInput.focus();
        
        phoneError.textContent = currentLang === 'en' 
            ? `Please enter a 10-digit mobile number (${custPhone.length}/10 entered)` 
            : `يرجى إدخال رقم جوال مكون من 10 أرقام (${custPhone.length}/10 تم إدخالها)`;
        phoneError.classList.remove('hidden');

        setTimeout(() => phoneInput.classList.remove('animate-shake'), 400);
        return;
    }

    const storeName = rawBranding.B || 'My Grocery Store';
    const orderDate = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    
    let orderTypeStr = fulfillmentType; let locationText = "";
    if (fulfillmentType === 'Pickup') {
        orderTypeStr = `Store Pickup`;
    } else if (fulfillmentType === 'Delivery') {
        const addressInput = document.getElementById('delivery-address').value.trim();
        if (addressInput) { locationText = `\n📍 *Delivery Address:*\n${addressInput}\n`; } 
        else {
            const proceed = confirm(currentLang === 'en' ? "You haven't entered a delivery address. Do you want to send the order anyway and share your location directly in WhatsApp?" : "لم تقم بإدخال عنوان التوصيل. هل ترغب في إرسال الطلب على أي حال ومشاركة موقعك مباشرة في واتساب؟");
            if (!proceed) return; 
            locationText = `\n📍 *Delivery Address:*\n(Will share via WhatsApp)\n`;
        }
    }

    let subtotal = 0;
    let msg = `🛒 *NEW GROCERY ORDER*\n📅 Date: ${orderDate}\n📍 Store: *${storeName}*\n🚚 Option: *${orderTypeStr}*\n👤 Name: *${custName}*\n📱 Mobile: *${custPhone}*\n------------------------\n`;
    
    cart.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0; const total = itemPrice * item.qty; subtotal += total;
        msg += `${index + 1}. ${item.qty}x ${item.name} @ ${itemPrice.toFixed(2)} = ${total.toFixed(2)}\n`;
    });

    msg += `------------------------\n*Total Amount: ${subtotal.toFixed(2)} ${globalCurrency}*\n_(Prices include VAT)_\n`;
    if (locationText) msg += locationText;

    closeCartModal();

    let phone = String(rawBranding.D).replace(/\D/g, '');
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let waUrl = isMobile ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}` : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;

    let link = document.createElement('a'); link.href = waUrl; link.target = '_blank';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    
    cart = []; updateCartUI();
}

function smartWhatsAppOrder() {
    const item = activeMenuData.find(i => String(i.id) === String(currentOpenItemId));
    const isVariable = item && item.variants && item.variants.length > 0;

    if (cart.length > 0) {
        const isAlreadyInCart = cart.some(c => String(c.id) === String(currentOpenItemId));
        if (!isAlreadyInCart && !isVariable) { addToCart(); }
        openCartModal();
    } else { 
        if (isVariable) {
            alert(currentLang === 'en' ? 'Please select a size/option first by clicking the + button.' : 'يرجى تحديد حجم/خيار أولاً بالضغط على زر +.');
        } else {
            openWhatsAppItem(); 
        }
    }
}        

function shareItem() {
    if (!currentOpenItemId) return;
    const item = activeMenuData.find(i => i.id === currentOpenItemId);
    const text = currentLang === 'en' ? `Check out ${item.name} at ${rawBranding.B || 'our restaurant'}! \n${window.location.href}` : `شاهد ${item.name} في ${rawBranding.B || 'مطعمنا'}! \n${window.location.href}`;
    if (navigator.share) { navigator.share({ title: item.name, text: text }).catch(console.error); } 
    else { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
}

function renderSocialMedia() {
    const container = document.getElementById('social-media-container'); container.innerHTML = '';
    const socialData = rawBranding.smartSocial || ""; 
    const links = String(socialData).split(',').map(link => link.trim().toLowerCase());
    
    const platforms = [
        { name: 'instagram', icon: 'fa-instagram', hover: 'hover:bg-pink-600', appScheme: (url) => `instagram://user?username=${extractUsername(url)}` },
        { name: 'facebook', icon: 'fa-facebook-f', hover: 'hover:bg-blue-600', appScheme: (url) => `fb://facewebmodal/f?href=${url}` },
        { name: 'snapchat', icon: 'fa-snapchat-ghost', hover: 'hover:bg-yellow-500 hover:text-black', appScheme: (url) => `snapchat://add/${extractUsername(url)}` },
        { name: 'tiktok', icon: 'fa-tiktok', hover: 'hover:bg-gray-700', appScheme: (url) => `tiktok://user?screen_name=${extractUsername(url)}` },
        { name: 'youtube', icon: 'fa-youtube', hover: 'hover:bg-red-600', appScheme: (url) => `vnd.youtube://${extractYouTubeId(url)}` }
    ];

    platforms.forEach(platform => {
        const matchedLink = links.find(l => l.includes(platform.name)); 
        const a = document.createElement('a');
        
        if (matchedLink) {
            let webUrl = matchedLink.startsWith('http') ? matchedLink : `https://${matchedLink}`;
            let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile && platform.appScheme) {
                a.href = platform.appScheme(webUrl);
                a.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = platform.appScheme(webUrl);
                    setTimeout(() => {
                        window.open(webUrl, '_blank');
                    }, 500);
                };
            } else {
                a.href = webUrl;
                a.target = '_blank';
            }
        } else {
            a.href = '#'; 
        }
        
        a.className = `w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 transition-all duration-300 ${platform.hover} hover:text-white shadow-md`;
        a.innerHTML = `<i class="fab ${platform.icon}"></i>`; 
        container.appendChild(a);
    });
}

function extractUsername(url) {
    try {
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const parts = cleanUrl.split('/');
        return parts[parts.length - 1].replace('@', '');
    } catch (e) {
        return '';
    }
}

function extractYouTubeId(url) {
    if (url.includes('channel/')) {
        const parts = url.split('channel/');
        return parts[1].split('/')[0];
    } else if (url.includes('@')) {
        const parts = url.split('@');
        return '@' + parts[1].split('/')[0];
    }
    return '';
}

/* ==========================================================
   PART 3: ARCADE, CART UI, PROMOS & SERVICE WORKER
   ========================================================== */

function openGameModal() {
    const modal = document.getElementById('gameModal'); const lobbyView = document.getElementById('game-lobby-view'); const playView = document.getElementById('game-play-view'); const frame = document.getElementById('gameFrame');
    lobbyView.classList.remove('hidden'); playView.classList.add('hidden'); frame.src = ''; 
    modal.classList.remove('hidden'); modal.classList.add('flex'); document.body.style.overflow = 'hidden';
}

function launchGame(gameUrl) {
    const lobbyView = document.getElementById('game-lobby-view'); const playView = document.getElementById('game-play-view'); const frame = document.getElementById('gameFrame'); const closeBtn = document.getElementById('arcade-close-btn');
    lobbyView.classList.add('hidden'); playView.classList.remove('hidden'); if(closeBtn) closeBtn.classList.add('hidden');
    frame.src = gameUrl; 
}

function backToGameLobby() {
    const lobbyView = document.getElementById('game-lobby-view'); const playView = document.getElementById('game-play-view'); const frame = document.getElementById('gameFrame'); const closeBtn = document.getElementById('arcade-close-btn');
    frame.src = ''; playView.classList.add('hidden'); lobbyView.classList.remove('hidden'); if(closeBtn) closeBtn.classList.remove('hidden');
}

function closeGameModal() {
    const modal = document.getElementById('gameModal'); const frame = document.getElementById('gameFrame');
    modal.classList.remove('flex'); modal.classList.add('hidden'); document.body.style.overflow = ''; 
    setTimeout(() => { frame.src = ''; }, 300);
}

let placeholderTimer;
function animateSearchPlaceholder() {
    clearInterval(placeholderTimer);
    const container = document.getElementById('animated-placeholder-container'); const span1 = document.getElementById('search-text-1'); const span2 = document.getElementById('search-text-2');
    if (!container || activeMenuData.length === 0) return;
    const suggestions = [...activeMenuData].sort(() => 0.5 - Math.random()).slice(0, 5).map(item => item.name);
    let currentIndex = 0;
    const prefix = currentLang === 'en' ? 'Try searching "' : 'جرب البحث عن "'; const suffix = '"...';
    document.getElementById('search-prefix').innerText = prefix; span1.innerText = suggestions[0] + suffix;

    placeholderTimer = setInterval(() => {
        currentIndex = (currentIndex + 1) % suggestions.length; span2.innerText = suggestions[currentIndex] + suffix;
        container.style.transition = 'transform 0.5s ease-in-out'; container.style.transform = 'translateY(-20px)';
        setTimeout(() => { container.style.transition = 'none'; span1.innerText = span2.innerText; container.style.transform = 'translateY(0)'; }, 500); 
    }, 3000);
}

let cart = [];
let fulfillmentType = 'Delivery'; 

function setFulfillmentType(type) {
    fulfillmentType = type;
    const btnDelivery = document.getElementById('btn-type-delivery'); 
    const btnPickup = document.getElementById('btn-type-pickup');
    const addressContainer = document.getElementById('address-input-container');

    if(type === 'Delivery') {
        btnDelivery.className = "flex-1 py-2 rounded-lg border-2 border-green-500 bg-green-50 text-green-700 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm";
        btnPickup.className = "flex-1 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-500 font-bold text-sm transition-all flex items-center justify-center gap-2 hover:bg-gray-50";
        if(addressContainer) addressContainer.classList.remove('hidden');
    } else {
        btnPickup.className = "flex-1 py-2 rounded-lg border-2 border-green-500 bg-green-50 text-green-700 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm";
        btnDelivery.className = "flex-1 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-500 font-bold text-sm transition-all flex items-center justify-center gap-2 hover:bg-gray-50";
        if(addressContainer) addressContainer.classList.add('hidden');
    }
}

function addToCart() {
    if(!currentOpenItemId) return; const item = activeMenuData.find(i => i.id === currentOpenItemId); if(!item) return;
    const existingItem = cart.find(c => c.id === currentOpenItemId);
    if (existingItem) { existingItem.qty += 1; } else { cart.push({ ...item, qty: 1 }); }
    updateCartUI(); 
}

function toggleQuickCart(id) {
    const itemIndex = cart.findIndex(c => String(c.id) === String(id));
    if (itemIndex > -1) { cart.splice(itemIndex, 1); } 
    else {
        const item = activeMenuData.find(i => String(i.id) === String(id));
        if (item) cart.push({ ...item, qty: 1 });
    }
    updateCartUI(); 
}

function updateQuickAddButtons() {
    activeMenuData.forEach(item => {
        const btns = document.querySelectorAll(`.quick-add-btn-${item.id}`);
        const icons = document.querySelectorAll(`.quick-add-icon-${item.id}`);
        const isInCart = cart.some(c => String(c.id) === String(item.id));
        
        btns.forEach(btn => {
            btn.className = isInCart 
                ? `quick-add-btn-${item.id} bg-red-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:scale-110 transition-colors duration-300 z-10 relative pointer-events-auto`
                : `quick-add-btn-${item.id} bg-green-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md hover:bg-green-600 hover:scale-110 transition-colors duration-300 z-10 relative pointer-events-auto`;
        });
        icons.forEach(icon => {
            icon.className = isInCart
                ? `quick-add-icon-${item.id} fas fa-minus text-[8px] sm:text-[10px] transition-transform duration-500 rotate-180 pointer-events-none`
                : `quick-add-icon-${item.id} fas fa-plus text-[8px] sm:text-[10px] transition-transform duration-500 rotate-0 pointer-events-none`;
        });

        if (item.variants && item.variants.length > 0) return; 
        
        const containers = document.querySelectorAll(`.stepper-container-${item.id}`);
        const cartItem = cart.find(c => String(c.id) === String(item.id));
        
        containers.forEach(container => {
            if (cartItem) {
                container.innerHTML = `
                    <div class="flex items-center bg-green-50 rounded-full border border-green-500 overflow-hidden shadow-sm h-full pointer-events-auto">
                        <button onclick="changeQty('${item.id}', -1)" class="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-200 transition"><i class="fas ${cartItem.qty === 1 ? 'fa-trash-alt text-[10px]' : 'fa-minus text-xs'}"></i></button>
                        <span class="font-bold text-sm w-4 text-center text-green-800">${cartItem.qty}</span>
                        <button onclick="changeQty('${item.id}', 1)" class="w-8 h-full flex items-center justify-center text-green-700 hover:bg-green-200 transition"><i class="fas fa-plus text-xs"></i></button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <button onclick="toggleQuickCart('${item.id}')" class="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-green-600 hover:scale-110 transition-all duration-300 pointer-events-auto">
                        <i class="fas fa-plus text-sm pointer-events-none"></i>
                    </button>
                `;
            }
        });
    });

    const modalCartBtn = document.getElementById('modal-cart-btn'); const modalCartIcon = document.getElementById('modal-cart-icon'); const modalCartText = document.getElementById('modal-cart-text');
    if (modalCartBtn && currentOpenItemId) {
        const item = activeMenuData.find(i => String(i.id) === String(currentOpenItemId));
        const isVariable = item && item.variants && item.variants.length > 0;
        
        if (isVariable) {
            modalCartBtn.onclick = function() { openCartModal(); };
            modalCartBtn.className = "flex-1 bg-blue-500 text-white text-center py-3 rounded-xl font-bold hover:bg-blue-600 transition-all duration-300 shadow-md flex items-center justify-center gap-2";
            modalCartIcon.className = "fas fa-shopping-basket text-lg"; 
            modalCartText.innerText = currentLang === 'en' ? "View Cart" : "عرض السلة";
        } else {
            modalCartBtn.onclick = function() { toggleQuickCart(currentOpenItemId); };
            const isInCart = cart.some(c => String(c.id) === String(currentOpenItemId));
            if (isInCart) {
                modalCartBtn.className = "flex-1 bg-red-500 text-white text-center py-3 rounded-xl font-bold hover:bg-red-600 transition-all duration-300 shadow-md flex items-center justify-center gap-2";
                modalCartIcon.className = "fas fa-trash-alt text-lg"; modalCartText.innerText = currentLang === 'en' ? "Remove from Cart" : "إزالة من السلة";
            } else {
                modalCartBtn.className = "flex-1 bg-green-500 text-white text-center py-3 rounded-xl font-bold hover:bg-green-600 transition-all duration-300 shadow-md flex items-center justify-center gap-2";
                modalCartIcon.className = "fas fa-cart-plus text-lg"; modalCartText.innerText = currentLang === 'en' ? "Add to Cart" : "أضف للسلة";
            }
        }
    }
}

function updateCartUI() {
    const countBadge = document.getElementById('cart-count-badge'); const floatingBtn = document.getElementById('cart-floating-btn'); const container = document.getElementById('cart-items-container');
    let totalItems = cart.reduce((sum, item) => sum + item.qty, 0); countBadge.innerText = totalItems;
    if (totalItems > 0) { floatingBtn.classList.remove('hidden'); floatingBtn.classList.add('flex'); } 
    else { floatingBtn.classList.add('hidden'); floatingBtn.classList.remove('flex'); closeCartModal(); }

    container.innerHTML = ''; let subtotal = 0;
    cart.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0; const itemTotal = itemPrice * item.qty; subtotal += itemTotal;
        container.innerHTML += `
            <div class="flex items-center gap-2 bg-white p-2 rounded-lg mb-2 shadow-sm border border-gray-100">
                <img src="${item.img}" class="w-12 h-12 rounded-md object-cover bg-gray-100 shrink-0" onerror="if(this.src.includes('.jpg')) { this.src=this.src.replace('.jpg', '.png'); } else if(this.src.includes('.png')) { this.src=this.src.replace('.png', '.jpeg'); } else { this.onerror=null; this.src='${rawBranding.smartLogo || 'https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/logo.png'}'; }">

                <div class="flex-grow min-w-0">
                    <h4 class="font-bold text-gray-800 text-xs leading-tight truncate">${item.name}</h4>
                    <div class="text-[10px] text-gray-500 mt-0.5 flex items-baseline gap-1">${getSmartCurrency(globalCurrency, '')} <span>${itemPrice.toFixed(2)}</span> <span>x ${item.qty}</span></div>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                    <span class="font-bold text-red-600 text-xs">${itemTotal.toFixed(2)}</span>
                    <div class="flex items-center">
                        <button onclick="removeFromCart('${item.id}')" class="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors me-1"><i class="fas fa-trash-alt text-xs"></i></button>
                        <div class="flex items-center gap-1 bg-gray-100 rounded p-0.5">
                            <button onclick="changeQty('${item.id}', -1)" class="w-5 h-5 flex items-center justify-center bg-white rounded text-gray-600 shadow-sm"><i class="fas fa-minus text-[10px]"></i></button>
                            <span class="font-bold text-xs w-3 text-center">${item.qty}</span>
                            <button onclick="changeQty('${item.id}', 1)" class="w-5 h-5 flex items-center justify-center bg-white rounded text-gray-600 shadow-sm"><i class="fas fa-plus text-[10px]"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById('cart-total').innerHTML = `${getSmartCurrency(globalCurrency, 'me-1')} ${subtotal.toFixed(2)}`;
    updateQuickAddButtons();

    if (typeof window.renderModalVariants === 'function') {
        window.renderModalVariants();
    }
}

function changeQty(id, change) {
    const item = cart.find(c => String(c.id) === String(id));
    if (item) { item.qty += change; if (item.qty <= 0) { cart = cart.filter(c => String(c.id) !== String(id)); } updateCartUI(); }
}

function removeFromCart(id) { cart = cart.filter(c => String(c.id) !== String(id)); updateCartUI(); }

function openCartModal() {
    if(cart.length === 0) return; 
    const now = new Date(); document.getElementById('bill-datetime').innerText = now.toLocaleString('en-US', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
    if(rawBranding.smartLogo) { const logo = document.getElementById('cart-brand-logo'); logo.src = rawBranding.smartLogo; logo.classList.remove('hidden'); }
    const modal = document.getElementById('cartModal'); modal.classList.remove('hidden'); modal.classList.add('flex'); document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    const modal = document.getElementById('cartModal'); modal.classList.remove('flex'); modal.classList.add('hidden'); document.body.style.overflow = '';
}

function clearCart() {
    if(confirm(currentLang === 'en' ? 'Are you sure you want to clear your cart?' : 'هل أنت متأكد أنك تريد تفريغ السلة؟')) {
        cart = [];
        updateCartUI();
    }
}

window.addVariantToCart = function(parentId, variantId) {
    const parentItem = activeMenuData.find(i => String(i.id) === String(parentId));
    if (!parentItem) return;
    const variant = parentItem.variants.find(v => v.variantId === variantId);
    if (!variant) return;
    
    cart.push({ 
        ...parentItem, 
        id: variant.variantId, 
        name: parentItem.name + ' (' + (variant.size || variant.name) + ')', 
        price: variant.price, 
        qty: 1 
    });
    updateCartUI();
};

function getGPSLocation() {
    if (navigator.geolocation) {
        const btn = document.getElementById('gps-btn'); const input = document.getElementById('delivery-address'); const originalIcon = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        navigator.geolocation.getCurrentPosition(
            (position) => { input.value = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`; btn.innerHTML = `<i class="fas fa-check text-green-600"></i>`; setTimeout(() => btn.innerHTML = originalIcon, 2000); },
            (error) => { alert('Location access denied or failed. Please type your address manually.'); btn.innerHTML = originalIcon; },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else { alert("Geolocation is not supported by your browser."); }
}

function openCategoryPage(title, isHighlight) {
    let items = [];
    if (isHighlight) { items = activeMenuData.filter(i => i.isTodaySpecial); } else { items = activeMenuData.filter(i => i.subCat === title); }
    items.sort((a, b) => a.order - b.order);
    document.getElementById('category-page-title').textContent = title;
    const grid = document.getElementById('category-page-grid'); grid.innerHTML = '';
    items.forEach((item, index) => {
        const delay = index * 20; const card = document.createElement('div');
        const bgClass = item.isTodaySpecial ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-gray-100';
        let cardClasses = `menu-card ${bgClass} rounded-2xl overflow-hidden border shadow-sm flex flex-col h-full opacity-0 translate-y-4 relative group`;
        card.className = cardClasses; card.style.animation = `fadeInUp 0.4s ease forwards ${delay}ms`; card.onclick = () => openModal(item.id);
        const isLiked = likedItems.has(item.id);
        let cardCurrencyDisplay = getSmartCurrency(globalCurrency, "text-[10px] font-normal mx-0.5 text-gray-500");
        const priceHtml = currentLang === 'en' ? `<span class="flex items-baseline">${cardCurrencyDisplay}<span>${item.price}</span></span>` : `<span class="flex items-baseline"><span>${item.price}</span>${cardCurrencyDisplay}</span>`;
        let badgeHtml = '';
        if(item.isTodaySpecial) badgeHtml = `<div class="absolute top-2 end-2 bg-gradient-to-r from-orange-400 to-red-500 px-2 py-1 rounded-lg text-[8px] sm:text-[10px] font-bold text-white shadow-sm z-10"><i class="fas fa-star text-[8px]"></i> Special</div>`;
        else if(item.video) badgeHtml = `<div class="absolute top-2 end-2 bg-black/70 backdrop-blur px-2 py-1 rounded-lg text-[8px] sm:text-[10px] font-bold text-white shadow-sm flex items-center gap-1 z-10"><i class="fas fa-play"></i> Video</div>`;
        const urls = item.imgUrls || [item.img]; let imagesHtml = '';
        urls.forEach(url => { imagesHtml += `<img src="${url}" loading="lazy" alt="Image" class="w-full h-full object-cover shrink-0 snap-center group-hover:scale-105 transition-transform duration-500" onerror="if(this.src.includes('.jpg')) { this.src=this.src.replace('.jpg', '.png'); } else if(this.src.includes('.png')) { this.src=this.src.replace('.png', '.jpeg'); } else { if(this.parentElement && this.parentElement.children.length > 1) { this.remove(); } else { this.onerror=null; this.classList.replace('object-cover', 'object-contain'); this.classList.add('p-4'); this.src='${rawBranding.smartLogo || 'https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/logo.png'}'; } }">`; });
        card.innerHTML = `
            <button onclick="toggleLike(event, '${item.id}')" class="absolute top-2 start-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm z-20 text-xs"><i class="${isLiked ? 'fas text-red-500' : 'far'} fa-heart"></i></button>
            <div class="relative aspect-[4/3] overflow-hidden shrink-0 bg-gray-100 rounded-t-2xl"><div class="mini-img-slider flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar" style="scroll-behavior: smooth;" data-img-count="${urls.length}">${imagesHtml}</div>${badgeHtml}</div>
            <div class="p-2 sm:p-3 flex flex-col flex-grow">
                <h4 class="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight line-clamp-1 mb-1">${item.name}</h4>
                <span class="font-extrabold text-red-600 whitespace-nowrap text-sm shrink-0 mb-1">${priceHtml}</span>
                <p class="text-[9px] sm:text-[10px] text-gray-500 line-clamp-2 mb-2 flex-grow">${item.desc}</p>
                <div class="flex justify-between items-end mt-auto">
                    ${item.calories ? `<div class="flex items-center gap-1 text-[8px] font-bold text-orange-500 bg-orange-50 w-fit px-1.5 py-0.5 rounded"><i class="fas fa-fire"></i> ${item.calories} Cal</div>` : '<div></div>'}
                    <button onclick="event.stopPropagation(); toggleQuickCart('${item.id}')" class="quick-add-btn-${item.id} bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-colors duration-300 z-10 relative pointer-events-auto"><i class="quick-add-icon-${item.id} fas fa-plus text-[10px] transition-transform duration-500 pointer-events-none"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    const modal = document.getElementById('category-page-overlay'); const backdrop = document.getElementById('category-backdrop'); const content = document.getElementById('category-content');
    modal.classList.remove('hidden'); modal.classList.add('flex'); void modal.offsetWidth; 
    backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100');
    content.classList.remove('translate-y-full', 'md:scale-95', 'opacity-0'); content.classList.add('translate-y-0', 'md:scale-100', 'opacity-100');
    document.body.style.overflow = 'hidden'; updateQuickAddButtons(); 
}

function closeCategoryPage() {
    const modal = document.getElementById('category-page-overlay'); const backdrop = document.getElementById('category-backdrop'); const content = document.getElementById('category-content');
    backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
    content.classList.remove('translate-y-0', 'md:scale-100', 'opacity-100'); content.classList.add('translate-y-full', 'md:scale-95', 'opacity-0');
    document.body.style.overflow = ''; setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
}

let catSwipeStartX = 0;
document.addEventListener('touchstart', e => { if (e.touches.length === 1) catSwipeStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
    const page = document.getElementById('category-page-overlay');
    if (page && !page.classList.contains('hidden')) {
        const touchEndX = e.changedTouches[0].clientX; const isLTR = currentLang === 'en';
        if (isLTR && catSwipeStartX < 40 && touchEndX > catSwipeStartX + 60) { closeCategoryPage(); }
        else if (!isLTR && catSwipeStartX > window.innerWidth - 40 && touchEndX < catSwipeStartX - 60) { closeCategoryPage(); }
    }
}, { passive: true });

window.toggleRecipe = function(forceCollapse = false) {
    const p = document.getElementById('modalRecipe'); const fade = document.getElementById('recipeFade'); const toggleText = document.getElementById('recipeToggleText');
    if (!toggleText.classList.contains('hidden') || forceCollapse) {
        if (forceCollapse || !p.classList.contains('line-clamp-2')) { p.classList.add('line-clamp-2'); fade.classList.remove('hidden'); toggleText.innerHTML = '<i class="fas fa-chevron-down"></i> Read More'; } 
        else { p.classList.remove('line-clamp-2'); fade.classList.add('hidden'); toggleText.innerHTML = '<i class="fas fa-chevron-up"></i> Show Less'; }
    }
};

document.addEventListener('click', (e) => {
    const recipeArea = document.getElementById('modalRecipeArea');
    if (recipeArea && !recipeArea.contains(e.target) && !recipeArea.classList.contains('hidden')) { window.toggleRecipe(true); }
});

let idleTimer; let promoSlideTimer; let isPromoActive = false; let validFlashCards = []; 

function gatherFlashCards() {
    validFlashCards = []; 
    activeMenuData.forEach(item => {
        if (item.flashCards) {
            const files = item.flashCards.split(',').map(u => u.trim()).filter(u => u !== "");
            files.forEach(file => { if (file.startsWith('http')) validFlashCards.push(file); });
        }
    });
    const baseUrl = 'https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/images/FlashCard/FlashCard';
    for (let i = 1; i <= 15; i++) { probeImageExtensions(`${baseUrl}${String(i).padStart(2, '0')}`); }
    buildPromo();
}

function probeImageExtensions(basePath) {
    const extensions = ['.jpg', '.png', '.jpeg'];
    function testNext(index) {
        if (index >= extensions.length) return; 
        const img = new Image();
        img.onload = () => { validFlashCards.push(img.src); buildPromo(); };
        img.onerror = () => testNext(index + 1); img.src = basePath + extensions[index];
    }
    testNext(0);
}

function buildPromo() {
    const slider = document.getElementById('promo-slider'); if(!slider) return; slider.innerHTML = '';
    const shuffledCards = validFlashCards.sort(() => 0.5 - Math.random());
    shuffledCards.forEach((url) => { slider.insertAdjacentHTML('beforeend', `<img src="${url}" class="w-full h-full object-cover flex-shrink-0 snap-center" alt="Promo">`); });
}

function showPromo() {
    const isProductModalOpen = !document.getElementById('productModal').classList.contains('hidden');
    const isCartModalOpen = !document.getElementById('cartModal').classList.contains('hidden');
    const isGameModalOpen = !document.getElementById('gameModal').classList.contains('hidden');
    if (validFlashCards.length === 0 || isPromoActive || isProductModalOpen || isCartModalOpen || isGameModalOpen) { resetIdleTimer(); return; }
    
    isPromoActive = true;
    const overlay = document.getElementById('promo-popup-overlay'); const backdrop = document.getElementById('promo-backdrop'); const content = document.getElementById('promo-content');
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    setTimeout(() => { backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100'); content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);

    const slider = document.getElementById('promo-slider'); let scrollPos = 0;
    promoSlideTimer = setInterval(() => {
        if (Date.now() - lastSliderInteraction < 5000) return;
        scrollPos += slider.clientWidth; if (scrollPos >= slider.scrollWidth - 10) scrollPos = 0; 
        slider.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }, 3000);
}

function closePromo() {
    if (!isPromoActive) return; isPromoActive = false; clearInterval(promoSlideTimer);
    const overlay = document.getElementById('promo-popup-overlay'); const backdrop = document.getElementById('promo-backdrop'); const content = document.getElementById('promo-content');
    backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
    content.classList.remove('scale-100', 'opacity-100'); content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }, 500);
    resetIdleTimer();
}

function resetIdleTimer() { clearTimeout(idleTimer); if (!isPromoActive) { idleTimer = setTimeout(showPromo, 20000); } }

['touchstart', 'mousedown', 'scroll', 'keydown', 'click'].forEach(evt => { document.addEventListener(evt, resetIdleTimer, true); });
resetIdleTimer();

let lastSliderInteraction = 0;
['touchstart', 'touchmove', 'mousedown', 'wheel'].forEach(evt => {
    document.addEventListener(evt, (e) => {
        if (e.target.closest('.mini-img-slider') || e.target.closest('.excel-banner-slider') || e.target.closest('#promo-slider') || e.target.closest('#modal-image-slider') || e.target.closest('.highlight-auto-scroll')) {
            lastSliderInteraction = Date.now();
        }
    }, { passive: true });
});

function maintainInfiniteCarousels() {
    document.querySelectorAll('.mini-img-slider, .excel-banner-slider, #modal-image-slider, #promo-slider').forEach(slider => {
        if (slider.clientWidth === 0 || slider.dataset.infiniteSetup === "true") return; 
        slider.querySelectorAll('[data-is-clone="true"]').forEach(c => c.remove());
        const imgs = Array.from(slider.children);
        if (imgs.length > 1) {
            const frontClone = imgs[imgs.length - 1].cloneNode(true); frontClone.dataset.isClone = "true";
            const backClone = imgs[0].cloneNode(true); backClone.dataset.isClone = "true";
            slider.insertBefore(frontClone, imgs[0]); slider.appendChild(backClone);
            slider.dataset.infiniteSetup = "true"; slider.dataset.realCount = imgs.length;
            setupDraggable(slider);
            slider.onscroll = null; if (slider.id === 'modal-image-slider') { clearInterval(window.modalCarouselTimer); }
            const originalBehavior = slider.style.scrollBehavior; slider.style.scrollBehavior = 'auto'; 
            const isRTL = document.documentElement.dir === 'rtl'; slider.scrollLeft = isRTL ? -slider.clientWidth : slider.clientWidth;
            void slider.offsetWidth; slider.style.scrollBehavior = originalBehavior || 'smooth'; 
        }
    });
}
setInterval(maintainInfiniteCarousels, 100);

document.addEventListener('scroll', (e) => {
    if (e.target && e.target.classList && e.target.dataset.infiniteSetup === "true") {
        const slider = e.target; const currentPos = Math.abs(slider.scrollLeft); const clientWidth = slider.clientWidth; const maxScroll = slider.scrollWidth - clientWidth;
        if (clientWidth === 0) return;
        const isRTL = document.documentElement.dir === 'rtl'; let teleported = false;

        if (currentPos <= 5) {
            slider.style.scrollBehavior = 'auto'; slider.scrollLeft = isRTL ? -(maxScroll - clientWidth) : (maxScroll - clientWidth);
            void slider.offsetWidth; slider.style.scrollBehavior = 'smooth'; teleported = true;
        } else if (currentPos >= maxScroll - 5) {
            slider.style.scrollBehavior = 'auto'; slider.scrollLeft = isRTL ? -clientWidth : clientWidth;
            void slider.offsetWidth; slider.style.scrollBehavior = 'smooth'; teleported = true;
        }

        const dotsContainer = slider.nextElementSibling;
        if (dotsContainer && dotsContainer.id === 'modal-image-dots') {
            const realCount = parseInt(slider.dataset.realCount); const activePos = teleported ? Math.abs(slider.scrollLeft) : currentPos;
            let activeIndex = Math.round(activePos / clientWidth) - 1; 
            if (activeIndex < 0) activeIndex = realCount - 1; if (activeIndex >= realCount) activeIndex = 0;
            Array.from(dotsContainer.children).forEach((dot, k) => { dot.className = `modal-dot w-2 h-2 rounded-full transition-all duration-300 ${k === activeIndex ? 'bg-red-500 scale-125' : 'bg-white/80 shadow-sm'}`; });
        }
    }
}, true); 

function triggerAutoSwipe(selector) {
    if (Date.now() - lastSliderInteraction < 5000) return;
    const isRTL = document.documentElement.dir === 'rtl';
    document.querySelectorAll(selector).forEach(slider => {
        if (slider.dataset.infiniteSetup === "true") {
            const currentPos = Math.abs(slider.scrollLeft);
            slider.scrollTo({ left: isRTL ? -(currentPos + slider.clientWidth) : (currentPos + slider.clientWidth), behavior: 'smooth' });
        }
    });
}
setInterval(() => triggerAutoSwipe('.mini-img-slider'), 2500);
setInterval(() => triggerAutoSwipe('.excel-banner-slider'), 3000);

setInterval(() => {
    if (Date.now() - lastSliderInteraction < 5000) return;
    const isRTL = document.documentElement.dir === 'rtl';
    document.querySelectorAll('.highlight-auto-scroll').forEach(slider => {
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        if (maxScroll <= 0) return; 
        
        let currentPos = Math.abs(slider.scrollLeft);
        const cardWidth = slider.children[0] ? slider.children[0].offsetWidth + 12 : 200; 
        
        if (currentPos >= maxScroll - 5) {
            slider.scrollTo({ left: 0, behavior: 'smooth' }); 
        } else {
            slider.scrollTo({ left: isRTL ? -(currentPos + cardWidth) : (currentPos + cardWidth), behavior: 'smooth' });
        }
    });
}, 3500); 

let carouselSwipeStartX = 0;
document.addEventListener('touchstart', (e) => {
    const slider = e.target.closest('.mini-img-slider, .excel-banner-slider, #modal-image-slider, #promo-slider');
    if (slider && slider.children.length > 1) { carouselSwipeStartX = e.touches[0].clientX; }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const slider = e.target.closest('.mini-img-slider, .excel-banner-slider, #modal-image-slider, #promo-slider');
    if (slider && slider.children.length > 1) {
        const maxScroll = slider.scrollWidth - slider.clientWidth; if (maxScroll <= 0) return; 
        const touchEndX = e.changedTouches[0].clientX; const diff = carouselSwipeStartX - touchEndX; 
        if (Math.abs(diff) > 40) {
            const isRTL = document.documentElement.dir === 'rtl'; const currentScroll = Math.abs(slider.scrollLeft);
            const isAtStart = currentScroll <= 5; const isAtEnd = currentScroll >= maxScroll - 5;
            const movingForward = isRTL ? diff < -40 : diff > 40; const movingBackward = isRTL ? diff > 40 : diff < -40;
            if (movingForward && isAtEnd) { slider.scrollTo({ left: 0, behavior: 'smooth' }); } 
            else if (movingBackward && isAtStart) { slider.scrollTo({ left: isRTL ? -maxScroll : maxScroll, behavior: 'smooth' }); }
        }
    }
}, { passive: true });

const pModal = document.getElementById('productModal'); const pContent = document.getElementById('modalContent');
let pullStartY = 0; let isPulling = false;

pModal.addEventListener('touchstart', (e) => {
    const scrollArea = pContent.querySelector('.overflow-y-auto');
    if (scrollArea && scrollArea.scrollTop <= 0) { pullStartY = e.touches[0].clientY; isPulling = true; pContent.classList.remove('transition-all', 'duration-300'); } 
    else { isPulling = false; }
}, { passive: true });

pModal.addEventListener('touchmove', (e) => {
    if (!isPulling) return; const deltaY = e.touches[0].clientY - pullStartY;
    if (deltaY > 0) { if (e.cancelable) e.preventDefault(); pContent.style.transform = `translateY(${deltaY * 0.6}px)`; } 
    else { pContent.style.transform = ''; isPulling = false; }
}, { passive: false });

pModal.addEventListener('touchend', () => {
    if (!isPulling) return; isPulling = false; pContent.classList.add('transition-all', 'duration-300');
    const currentPullAmount = parseInt(pContent.style.transform.replace(/[^\d.]/g, '') || "0");
    if (currentPullAmount > 55) { pContent.style.transform = ''; closeModal(); } 
    else { pContent.style.transform = ''; }
});

function openBrandModal() {
    const img = document.getElementById('brandModalImage'); img.src = rawBranding.smartLogo || 'https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/logo.png'; 
    document.getElementById('brandModalTitle').textContent = rawBranding.B || "Our Restaurant";
    const defaultDescEn = "Welcome to our restaurant! We pride ourselves on serving delicious, high-quality food made with fresh ingredients and authentic recipes.";
    const defaultDescAr = "مرحباً بكم في مطعمنا! نفخر بتقديم أشهى المأكولات عالية الجودة المحضرة بمكونات طازجة ووصفات أصيلة.";
    document.getElementById('brandModalDesc').textContent = currentLang === 'en' ? defaultDescEn : defaultDescAr;
    document.getElementById('brandModalPhone').textContent = rawBranding.C || "--";
    document.getElementById('brandModalWA').textContent = rawBranding.D || "--";
    document.getElementById('brandModalAddress').textContent = rawBranding.H || "--";
    const mapLink = document.getElementById('brandModalMap');
    if (rawBranding.I) { mapLink.href = rawBranding.I; mapLink.classList.remove('pointer-events-none'); } 
    else { mapLink.href = '#'; mapLink.classList.add('pointer-events-none'); }
    const socialContainer = document.getElementById('brandModalSocial'); socialContainer.innerHTML = '';
    const links = String(rawBranding.smartSocial || "").split(',').map(l => l.trim().toLowerCase());
    const platforms = [
        { name: 'instagram', icon: 'fa-instagram', hover: 'hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600', color: 'text-pink-600' },
        { name: 'facebook', icon: 'fa-facebook-f', hover: 'hover:bg-blue-600', color: 'text-blue-600' },
        { name: 'snapchat', icon: 'fa-snapchat-ghost', hover: 'hover:bg-yellow-400 hover:text-black', color: 'text-yellow-500' },
        { name: 'tiktok', icon: 'fa-tiktok', hover: 'hover:bg-black', color: 'text-gray-800' },
        { name: 'youtube', icon: 'fa-youtube', hover: 'hover:bg-red-600', color: 'text-red-600' }
    ];
    platforms.forEach(p => {
        const match = links.find(l => l.includes(p.name));
        if (match) {
            const a = document.createElement('a'); a.href = match.startsWith('http') ? match : `https://${match}`; a.target = '_blank';
            a.className = `w-12 h-12 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-xl transition-all duration-300 ${p.hover} hover:text-white hover:border-transparent shadow-sm hover:shadow-md hover:-translate-y-1 group`;
            a.innerHTML = `<i class="fab ${p.icon} ${p.color} group-hover:text-white transition-colors"></i>`; socialContainer.appendChild(a);
        }
    });
    const modal = document.getElementById('brandModal'); const backdrop = document.getElementById('brandModalBackdrop'); const content = document.getElementById('brandModalContent');
    modal.classList.remove('hidden'); modal.classList.add('flex'); void modal.offsetWidth; 
    backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100');
    content.classList.remove('translate-y-full', 'md:scale-95', 'opacity-0'); content.classList.add('translate-y-0', 'md:scale-100', 'opacity-100');
    document.body.style.overflow = 'hidden'; setupBrandPullToClose(); 
}

function closeBrandModal() {
    const modal = document.getElementById('brandModal'); const backdrop = document.getElementById('brandModalBackdrop'); const content = document.getElementById('brandModalContent');
    backdrop.classList.remove('opacity-100'); backdrop.classList.add('opacity-0');
    content.classList.remove('translate-y-0', 'md:scale-100', 'opacity-100'); content.classList.add('translate-y-full', 'md:scale-95', 'opacity-0');
    document.body.style.overflow = ''; setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 300); 
}

function setupBrandPullToClose() {
    const pModal = document.getElementById('brandModal'); const pContent = document.getElementById('brandModalContent');
    if(pModal.hasPullListener) return; pModal.hasPullListener = true;
    let pullStartY = 0; let isPulling = false;
    pModal.addEventListener('touchstart', (e) => {
        const scrollArea = pContent.querySelector('.overflow-y-auto');
        if (scrollArea && scrollArea.scrollTop <= 0) { pullStartY = e.touches[0].clientY; isPulling = true; pContent.classList.remove('transition-all', 'duration-300'); } 
        else { isPulling = false; }
    }, { passive: true });
    pModal.addEventListener('touchmove', (e) => {
    if (!isPulling) return; const deltaY = e.touches[0].clientY - pullStartY;
    if (deltaY > 0) { if (e.cancelable) e.preventDefault(); pContent.style.transform = `translateY(${deltaY * 0.6}px)`; } 
    else { pContent.style.transform = ''; isPulling = false; }
}, { passive: false });

pModal.addEventListener('touchend', () => {
    if (!isPulling) return; isPulling = false; pContent.classList.add('transition-all', 'duration-300');
    const currentPullAmount = parseInt(pContent.style.transform.replace(/[^\d.]/g, '') || "0");
    if (currentPullAmount > 55) { pContent.style.transform = ''; closeBrandModal(); } 
    else { pContent.style.transform = ''; }
});
}

function setupSearch() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const placeholderWrapper = document.getElementById('search-placeholder-wrapper');
        if(e.target.value.length > 0) { placeholderWrapper.classList.add('opacity-0'); } 
        else { placeholderWrapper.classList.remove('opacity-0'); }
        searchQuery = e.target.value.toLowerCase().trim(); executeFilter();
    });
}

window.onload = init; setupSearch(); 

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('https://raw.githubusercontent.com/DigiDatas/MyGroceryStore/main/sw.js')
            .then(reg => {
                console.log('PWA Service Worker registered successfully!'); reg.update();
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log("New update found! Refreshing to apply changes..."); window.location.reload();
                            }
                        };
                    }
                };
            })
            .catch(err => console.error('PWA Registration failed:', err));
    });
}

window.addEventListener('pageshow', function (event) { if (event.persisted) { window.location.reload(); } });
