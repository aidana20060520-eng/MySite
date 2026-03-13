// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active navigation link highlight
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Animate skill bars when they come into view
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skillBars = entry.target.querySelectorAll('.skill-progress');
            skillBars.forEach(bar => {
                const level = bar.getAttribute('data-level');
                bar.style.width = level + '%';
            });
        }
    });
}, observerOptions);

const skillsSection = document.querySelector('.skills');
if (skillsSection) {
    skillObserver.observe(skillsSection);
}

// Contact form handling with enhanced data management
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const message = formData.get('message').trim();
        
        // Enhanced validation
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        if (name.length < 2) {
            showNotification('Name must be at least 2 characters long', 'error');
            return;
        }
        
        if (message.length < 10) {
            showNotification('Message must be at least 10 characters long', 'error');
            return;
        }
        
        // Store form data (for analytics/demo purposes)
        const contactData = {
            name: name,
            email: email,
            message: message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        // Log contact data (in production, this would be sent to a server)
        console.log('Contact form submission:', contactData);
        
        // Track form submission
        trackInteraction('contact-form-submit', contactData);
        
        // Option 1: Save to Firebase (primary)
        saveToFirebase(contactData);
        
        // Option 2: Store in localStorage (backup)
        storeContactMessage(contactData);
        
        // Simulate form submission (in a real application, this would send to a server)
        showNotification('Thank you for your message! I will get back to you soon.', 'success');
        this.reset();
    });
}

// Import Firebase functions (available globally from the module script)
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Get Firebase instances from window (set in the HTML module)
const db = window.firebaseDB;
const app = window.firebaseApp;

// Firebase integration for contact form
async function saveToFirebase(contactData) {
    try {
        const docRef = await addDoc(collection(db, 'contactMessages'), {
            ...contactData,
            timestamp: serverTimestamp(),
            status: 'new',
            read: false
        });
        console.log('Message saved to Firebase with ID:', docRef.id);
        showNotification('Message sent successfully!', 'success');
        return docRef.id;
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        showNotification('Failed to send message. Please try again.', 'error');
        throw error;
    }
}

// Get all messages from Firebase
async function getFirebaseMessages() {
    try {
        const q = query(collection(db, 'contactMessages'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return messages;
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}

// Export Firebase messages to CSV
async function exportFirebaseMessages() {
    const messages = await getFirebaseMessages();
    const csvContent = "ID,Name,Email,Message,Timestamp,Status\n" + 
        messages.map(m => `"${m.id}","${m.name}","${m.email}","${m.message}","${m.timestamp?.toDate?.() || m.timestamp}","${m.status}"`).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firebase_contact_messages.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Local storage backup
function storeContactMessage(contactData) {
    const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
    messages.push(contactData);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
        messages.splice(0, messages.length - 100);
    }
    
    localStorage.setItem('contact_messages', JSON.stringify(messages));
    console.log('Message stored locally:', contactData);
}

// View stored messages (for admin use)
async function viewStoredMessages() {
    try {
        // Try Firebase first, fallback to localStorage
        const firebaseMessages = await getFirebaseMessages();
        console.log('Firebase messages:', firebaseMessages);
        
        // Also show localStorage messages as backup
        const localMessages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
        console.log('Local storage messages:', localMessages);
        
        showNotification(`Found ${firebaseMessages.length} Firebase messages and ${localMessages.length} local messages`, 'info');
    } catch (error) {
        console.error('Error viewing messages:', error);
        showNotification('Error retrieving messages', 'error');
    }
}

// Export messages to file
function exportMessagesToFile() {
    // Export from Firebase
    exportFirebaseMessages();
}
document.getElementById('downloadCV')?.addEventListener('click', function() {
    // Track CV download
    trackInteraction('cv-download', { timestamp: new Date().toISOString() });
    
    // Create a sample CV content (in production, this would be a real PDF file)
    const cvContent = `Aidana Aldabergen - UX/UI Designer CV\n\nContact: aidanaa2006@icloud.com\n\nProfile:\nPassionate UX/UI Designer from Kazakhstan with creative skills and dedication to user experience design.\n\nSkills:\n- Figma (Medium Level)\n- HTML/CSS (Beginner)\n- UX Research (Beginner)\n- App Design (Beginner)\n- Creativity (Advanced)\n\nLanguages:\n- Kazakh (Native)\n- Russian (Fluent)\n- English (B2+)\n\nCertificates:\n- IBM UX Design Fundamentals (March 2026)\n- UI Design Bootcamp (July 2025)\n\nGenerated: ${new Date().toLocaleDateString()}`;
    
    // Create and download the CV file
    const blob = new Blob([cvContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Aidana_Aldabergen_CV.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('CV downloaded successfully!', 'success');
});

// Click tracking and analytics
function trackInteraction(action, data) {
    // Store interaction data (in production, this would be sent to analytics service)
    const interactions = JSON.parse(localStorage.getItem('portfolio_interactions') || '[]');
    interactions.push({
        action: action,
        data: data,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 interactions
    if (interactions.length > 50) {
        interactions.splice(0, interactions.length - 50);
    }
    
    localStorage.setItem('portfolio_interactions', JSON.stringify(interactions));
    console.log('Tracked interaction:', { action, data });
}

// Add click tracking to all elements with data-track attribute
document.addEventListener('DOMContentLoaded', function() {
    const trackableElements = document.querySelectorAll('[data-track]');
    
    trackableElements.forEach(element => {
        element.addEventListener('click', function(e) {
            const trackAction = this.getAttribute('data-track');
            const trackData = {
                elementType: this.tagName.toLowerCase(),
                href: this.getAttribute('href') || 'N/A',
                text: this.textContent.trim(),
                timestamp: new Date().toISOString()
            };
            
            trackInteraction(trackAction, trackData);
        });
    });
    
    // Display interaction data in console for demo
    console.log('Current interactions:', JSON.parse(localStorage.getItem('portfolio_interactions') || '[]'));
});

// Enhanced notification system with more types
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: 0.95rem;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#6366f1';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after specified duration
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Enhanced email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length > 5 && email.length < 254;
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        default:
            notification.style.backgroundColor = '#6366f1';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add typing effect to hero title
function typeWriter() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    heroTitle.style.borderRight = '3px solid #fbbf24';
    
    let i = 0;
    function type() {
        if (i < text.length) {
            heroTitle.textContent += text.charAt(i);
            i++;
            setTimeout(type, 50);
        } else {
            heroTitle.style.borderRight = 'none';
        }
    }
    
    setTimeout(type, 500);
}

// Initialize typing effect when page loads
// This is now handled in the combined load event listener above

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add hover effect to project cards
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add hover effect to certificate cards
const certificateCards = document.querySelectorAll('.certificate-card');
certificateCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Lazy loading for images (when you add actual images)
function lazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
lazyLoad();

// Add scroll reveal animation
function revealOnScroll() {
    const reveals = document.querySelectorAll('.skill-card, .project-card, .certificate-card');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('reveal');
        }
    });
}

// Check elements immediately on page load
window.addEventListener('load', () => {
    revealOnScroll();
    typeWriter();
});

window.addEventListener('scroll', revealOnScroll);

// Initialize reveal animations
revealOnScroll();


// Add CSS for admin controls
function addMicroInteractions() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn, .social-link');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
    });
}

// Add CSS for ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn:active, .social-link:active {
        transform: translateY(-1px) scale(0.98);
    }
    
    .contact-btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);

// Initialize micro-interactions
addMicroInteractions();

// Add CSS for reveal animation
const style = document.createElement('style');
style.textContent = `
    .reveal {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .skill-card,
    .project-card,
    .certificate-card {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .nav-link.active {
        color: var(--primary-color);
    }
    
    .nav-link.active::after {
        width: 100%;
    }
    
    .hamburger.active .bar:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }
    
    .hamburger.active .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
    }
`;
document.head.appendChild(style);
