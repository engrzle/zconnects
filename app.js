const APP_URL = 'https://script.google.com/macros/s/AKfycbw3c915eKVYlXdYhva6ZtlNDXOahN7nXWrht_PPQKYfHf6Su_jgmTOSs4dlqeEZbxvsxA/exec';

document.addEventListener("DOMContentLoaded", loadPublicReviews);

async function loadPublicReviews() {
    try {
        const response = await fetch(`${APP_URL}?action=get_public_reviews`);
        const reviews = await response.json();
        
        const track = document.getElementById('reviewsTrack');
        document.getElementById('reviewsLoader').style.display = 'none';

        if (reviews.length === 0) {
            track.innerHTML = '<p style="text-align:center; width:100%; color:#94a3b8;">No public reviews yet.</p>';
            return;
        }

        reviews.forEach(r => {
            const stars = '★'.repeat(Math.floor(r.rating)) + (r.rating % 1 ? '½' : '');
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <div class="r-header">
                    <div class="r-avatar">${r.name.charAt(0)}</div>
                    <div class="r-info">
                        <h4>${r.name}</h4>
                        <span>${r.service}</span>
                    </div>
                </div>
                <div class="r-stars">${stars}</div>
                <div class="r-body">"${r.comment}"</div>
                <div class="r-footer">
                    <span>${r.date}</span>
                    <div class="verified-badge">✓ Verified Client</div>
                </div>
            `;
            track.appendChild(card);
        });

    } catch (err) {
        console.error("Review Load Error:", err);
        document.getElementById('reviewsLoader').innerText = "Unable to load reviews.";
    }
}

// --- SMART SEARCH ENGINE ---
function filterServices() {
    let rawInput = document.getElementById('serviceSearch').value.toLowerCase().trim();
    
    let input = rawInput.replace(/aircon|air conditioner|air/g, "ac");
    
    let categories = document.getElementsByClassName('category-card');
    let searchTerms = input.split(' ').filter(t => t !== '');

    if (searchTerms.length === 0) {
        for (let i = 0; i < categories.length; i++) {
            categories[i].style.display = "block";
            let subServices = categories[i].getElementsByClassName('sub-service-item');
            for (let j = 0; j < subServices.length; j++) {
                subServices[j].style.display = "block";
            }
        }
        return;
    }

    let serviceSection = document.getElementById('serviceList');
    if (rawInput.length === 1 && window.innerWidth > 768 && window.scrollY < serviceSection.offsetTop - 150) {
        window.scrollTo({ top: serviceSection.offsetTop - 80, behavior: 'smooth' });
    }

    for (let i = 0; i < categories.length; i++) {
        let category = categories[i];
        let titleText = category.querySelector('.cat-title').innerText.toLowerCase();
        let subServices = category.getElementsByClassName('sub-service-item');
        
        let categoryMatch = searchTerms.some(term => {
            let regex = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            return regex.test(titleText);
        });
        
        let hasVisibleSubService = false;

        for (let j = 0; j < subServices.length; j++) {
            let subItem = subServices[j];
            let subText = subItem.innerText.toLowerCase();
            
            let subMatch = searchTerms.every(term => {
                let regex = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                return regex.test(subText);
            });

            if (categoryMatch || subMatch) {
                subItem.style.display = "block";
                hasVisibleSubService = true;
            } else {
                subItem.style.display = "none";
            }
        }

        category.style.display = hasVisibleSubService ? "block" : "none";
    }
}
// --- END SMART SEARCH ENGINE ---

function promptBooking(service, category) {
    const modal = document.getElementById('confirmModal');
    const proceedBtn = document.getElementById('confirmProceed');
    document.getElementById('confirmText').innerText = `Proceed with a request for ${service}?`;
    modal.style.display = 'flex';
    proceedBtn.onclick = function() { populateForm(service, category); closePrompt(); };
}

function closePrompt() { document.getElementById('confirmModal').style.display = 'none'; }

function populateForm(service, category) {
    document.getElementById('quote-form').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('serviceCat').value = category;
    document.getElementById('projDesc').value = `Requesting service for: ${service}\n---\n[Describe details here]`;
}

function updateUrgency(element) {
    document.querySelectorAll('.urgency-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    element.querySelector('input').checked = true;
}

function checkStatus() {
    const id = document.getElementById('trackId').value;
    const resultBox = document.getElementById('statusResult');
    const statusVal = document.getElementById('statusValue');
    const clientVal = document.getElementById('statusClient');
    if(!id) return alert("Please enter a Booking ID");
    resultBox.style.display = 'block';
    statusVal.innerText = "Searching...";
    fetch(`${APP_URL}?action=track&id=${id}`).then(res => res.json()).then(data => {
        if(data.status === 'success') { statusVal.innerText = data.jobStatus; statusVal.style.color = '#16a34a'; clientVal.innerText = data.clientName; } 
        else { statusVal.innerText = "Booking Not Found"; statusVal.style.color = '#ef4444'; clientVal.innerText = "-"; }
    }).catch(err => { statusVal.innerText = "Error checking status"; });
}

function openTC() { document.getElementById('tcModal').style.display = 'flex'; }
function closeTC() { document.getElementById('tcModal').style.display = 'none'; }
window.onclick = function(event) {
    if (event.target == document.getElementById('tcModal')) { closeTC(); }
}

// ENHANCEMENT: Expandable Chat Menu Logic
document.getElementById('fabMain').addEventListener('click', function() {
    document.getElementById('fabOptions').classList.toggle('open');
});

// ENHANCEMENT: Image Upload Preview Logic
document.getElementById('projPhotos').addEventListener('change', function(e) {
    const preview = document.getElementById('photoPreview');
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
        preview.src = '';
    }
});

// Form Submission
document.getElementById('quoteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const locCheck = document.getElementById('custLocation').value;
    if (locCheck === 'Other') {
        alert("Notice: Our rapid dispatch is currently optimized for Metro Cebu. We will review your request, but please expect potential scheduling delays or out-of-town mobilization charges.");
    }

    const btn = document.getElementById('submitBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');
    const photoFile = document.getElementById('projPhotos').files[0];
    
    btn.disabled = true;
    btnSpinner.style.display = 'block';
    btnText.innerText = "Dispatching Request...";

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    try {
        const data = {
            honeypot: document.getElementById('website_hp').value,
            name: document.getElementById('custName').value,
            phone: document.getElementById('custPhone').value,
            email: document.getElementById('custEmail').value,
            location: document.getElementById('custLocation').value,
            category: document.getElementById('serviceCat').value,
            urgency: document.querySelector('input[name="urgency"]:checked').value,
            description: document.getElementById('projDesc').value,
            image: photoFile ? await toBase64(photoFile) : null
        };

        await fetch(APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        });

        document.getElementById('formContent').style.display = 'none';
        document.getElementById('formSuccess').style.display = 'block';
        window.scrollTo({ top: document.getElementById('quote-form').offsetTop - 100, behavior: 'smooth' });

    } catch (err) {
        console.error("Submission Error:", err);
        alert("Technical error. Please check your connection and try again.");
        btn.disabled = false;
        btnSpinner.style.display = 'none';
        btnText.innerText = "Submit Secure Request";
    }
});
