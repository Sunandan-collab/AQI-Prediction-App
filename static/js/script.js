// Sample data for the form
const sampleData = {
    'PM2.5': 50.32,
    'PM10': 102.77,
    'NO': 1.73,
    'NO2': 33.85,
    'NOx': 19.41,
    'NH3': 12.56,
    'CO': 0.1,
    'SO2': 13.65,
    'O3': 68.15,
    'Benzene': 0.2,
    'Toluene': 4.29,
    'Xylene': 0.1
};

// Initialize gauge chart
let gauge = null;
let animationInProgress = false;

function initGauge() {
    const opts = {
        angle: 0,
        lineWidth: 0.44,
        radiusScale: 1,
        pointer: {
            length: 0.6,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMax: false,
        limitMin: false,
        colorStart: '#6FADCF',
        colorStop: '#8FC0DA',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
        staticLabels: {
            font: "12px sans-serif",
            labels: [0, 50, 100, 150, 200, 300, 500],
            color: "#000000",
            fractionDigits: 0
        },
        staticZones: [
            {strokeStyle: "#00e400", min: 0, max: 50},
            {strokeStyle: "#ffff00", min: 50, max: 100},
            {strokeStyle: "#ff7e00", min: 100, max: 150},
            {strokeStyle: "#ff0000", min: 150, max: 200},
            {strokeStyle: "#8f3f97", min: 200, max: 300},
            {strokeStyle: "#7e0023", min: 300, max: 500}
        ],
        renderTicks: {
            divisions: 5,
            divWidth: 1.1,
            divLength: 0.7,
            divColor: '#333333',
            subDivisions: 3,
            subLength: 0.5,
            subWidth: 0.6,
            subColor: '#666666'
        }
    };

    const target = document.getElementById('gauge-chart');
    gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 500;
    gauge.setMinValue(0);
    gauge.animationSpeed = 32;
    gauge.set(0);
}

// Get category and color based on AQI value
function getAQICategory(value) {
    if (value <= 50) {
        return {category: "Good", color: "#00e400"};
    } else if (value <= 100) {
        return {category: "Moderate", color: "#ffff00"};
    } else if (value <= 150) {
        return {category: "Unhealthy for Sensitive Groups", color: "#ff7e00"};
    } else if (value <= 200) {
        return {category: "Unhealthy", color: "#ff0000"};
    } else if (value <= 300) {
        return {category: "Very Unhealthy", color: "#8f3f97"};
    } else {
        return {category: "Hazardous", color: "#7e0023"};
    }
}

// Animated counter for gauge value
function animateValue(obj, start, end, duration) {
    if (animationInProgress) return;
    
    animationInProgress = true;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        obj.textContent = currentValue;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = end;
            animationInProgress = false;
        }
    };
    window.requestAnimationFrame(step);
}

// Handle form submission
document.getElementById('prediction-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Add loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    const formData = new FormData(this);
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Initialize gauge if not already done
            if (!gauge) {
                initGauge();
            }
            
            // Apply scale-in animation to gauge container
            const gaugeContainer = document.querySelector('.gauge-container');
            gaugeContainer.classList.remove('scale-in');
            void gaugeContainer.offsetWidth; // Trigger reflow
            gaugeContainer.classList.add('scale-in');
            
            // Set gauge value with animation
            const currentValue = gauge.value || 0;
            const targetValue = data.aqi;
            
            // Animate the gauge
            let speed = 1;
            let refreshInterval = 30;
            let increment = (targetValue - currentValue) / (1000 / refreshInterval);
            
            let intervalId = setInterval(() => {
                let newValue = gauge.value + increment;
                
                if ((increment > 0 && newValue >= targetValue) || 
                    (increment < 0 && newValue <= targetValue)) {
                    clearInterval(intervalId);
                    gauge.set(targetValue);
                } else {
                    gauge.set(newValue);
                }
            }, refreshInterval);
            
            // Animate the displayed value
            const gaugeValueElement = document.getElementById('gauge-value');
            animateValue(gaugeValueElement, currentValue, targetValue, 1000);
            
            // Update category with animation
            const { category, color } = getAQICategory(targetValue);
            const categoryElement = document.getElementById('aqi-category');
            categoryElement.textContent = category;
            categoryElement.style.color = color;
            
            // Add animation to category
            categoryElement.style.animation = 'none';
            void categoryElement.offsetWidth; // Trigger reflow
            categoryElement.style.animation = 'fade-in 0.5s ease forwards';
            
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('An error occurred while processing your request.', 'error');
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

// Fill form with sample data
document.getElementById('sample-data-btn').addEventListener('click', function() {
    for (const [key, value] of Object.entries(sampleData)) {
        const input = document.getElementById(key);
        if (input) {
            // Create animation effect for filling inputs
            input.style.transition = 'background-color 0.3s ease';
            input.style.backgroundColor = '#e6f7ff';
            input.value = value;
            
            setTimeout(() => {
                input.style.backgroundColor = '';
            }, 500);
        }
    }
    
    // Show notification
    showNotification('Sample data loaded successfully!', 'success');
});

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification type class
    notification.className = `notification ${type}`;
    
    // Set message
    notification.textContent = message;
    
    // Show notification
    notification.style.display = 'block';
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

// Initialize particles.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize gauge
    initGauge();
    
    // Initialize particles.js
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 50,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#4361ee'
            },
            shape: {
                type: 'circle',
                stroke: {
                    width: 0,
                    color: '#000000'
                }
            },
            opacity: {
                value: 0.3,
                random: true,
                anim: {
                    enable: false,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 5,
                random: true,
                anim: {
                    enable: false,
                    speed: 40,
                    size_min: 0.1,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#4361ee',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
                attract: {
                    enable: false,
                    rotateX: 600,
                    rotateY: 1200
                }
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 0.5
                    }
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.3s ease;
            color: white;
            max-width: 350px;
            display: none;
        }
        
        .notification.success {
            background-color: #10b981;
        }
        
        .notification.error {
            background-color: #ef4444;
        }
        
        .notification.info {
            background-color: #3b82f6;
        }
    `;
    document.head.appendChild(style);
    
    // Add form input animations
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focus');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focus');
        });
    });
    
    // Add animation to categories
    const categories = document.querySelectorAll('.category');
    categories.forEach((category, index) => {
        category.style.opacity = '0';
        category.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            category.style.transition = 'all 0.5s ease';
            category.style.opacity = '1';
            category.style.transform = 'translateY(0)';
        }, 100 * index);
    });
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

// Simulate a data fetch with sample data
function simulatePrediction() {
    // Fill the form with sample data
    document.getElementById('sample-data-btn').click();
    
    // Wait a moment and then submit the form
    setTimeout(() => {
        // Create fake response for demonstration purposes
        const fakeResponse = {
            success: true,
            aqi: Math.floor(Math.random() * 300) + 30, // Random AQI between 30 and 330
            category: "",
            color: ""
        };
        
        // Get category and color
        const categoryInfo = getAQICategory(fakeResponse.aqi);
        fakeResponse.category = categoryInfo.category;
        fakeResponse.color = categoryInfo.color;
        
        // Update UI
        if (!gauge) {
            initGauge();
        }
        
        // Apply scale-in animation to gauge container
        const gaugeContainer = document.querySelector('.gauge-container');
        gaugeContainer.classList.remove('scale-in');
        void gaugeContainer.offsetWidth; // Trigger reflow
        gaugeContainer.classList.add('scale-in');
        
        // Animate the gauge
        const currentValue = gauge.value || 0;
        const targetValue = fakeResponse.aqi;
        
        let speed = 1;
        let refreshInterval = 30;
        let increment = (targetValue - currentValue) / (1000 / refreshInterval);
        
        let intervalId = setInterval(() => {
            let newValue = gauge.value + increment;
            
            if ((increment > 0 && newValue >= targetValue) || 
                (increment < 0 && newValue <= targetValue)) {
                clearInterval(intervalId);
                gauge.set(targetValue);
            } else {
                gauge.set(newValue);
            }
        }, refreshInterval);
        
        // Animate the displayed value
        const gaugeValueElement = document.getElementById('gauge-value');
        animateValue(gaugeValueElement, currentValue, targetValue, 1000);
        
        // Update category with animation
        const categoryElement = document.getElementById('aqi-category');
        categoryElement.textContent = fakeResponse.category;
        categoryElement.style.color = fakeResponse.color;
        
        // Add animation to category
        categoryElement.style.animation = 'none';
        void categoryElement.offsetWidth; // Trigger reflow
        categoryElement.style.animation = 'fade-in 0.5s ease forwards';
    }, 1000);
}