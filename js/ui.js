const CAR_DATA = [
    {
        id: 'dolphin-mini',
        name: 'BYD Dolphin Mini',
        specs: ['Autonomía: 380 km', 'Potencia: 75 HP', 'Carga rápida: 30 min'],
        image: 'https://res.cloudinary.com/djw2gpjal/image/upload/v1771480595/BYD_Dolphin_Mini_ouz1df.webp',
        video: 'https://res.cloudinary.com/djw2gpjal/video/upload/v1771480595/Dolphin_Mini_Video.mp4', // Ejemplo de URL
        color: '#0089FF'
    },
    {
        id: 'seagull',
        name: 'BYD Seagull',
        specs: ['Autonomía: 405 km', 'Smart Connectivity', '0-50 km/h: 4.9s'],
        image: 'https://res.cloudinary.com/djw2gpjal/image/upload/v1771480593/Coche_Byd_Seagull_yf2zcn.avif',
        video: 'https://res.cloudinary.com/djw2gpjal/video/upload/v1771480593/Seagull_Video.mp4',
        color: '#FFFFFF'
    },
    {
        id: 'polanco',
        name: 'BYD Polanco Edition',
        specs: ['Diseño Premium', 'Interior Cuero', 'Rines 18"'],
        image: 'https://res.cloudinary.com/djw2gpjal/image/upload/v1771480593/BYD_Polanco_m9x3vk.jpg',
        video: 'https://res.cloudinary.com/djw2gpjal/video/upload/v1771480593/Polanco_Video.mp4',
        color: '#000000'
    },
    {
        id: 'king',
        name: 'BYD King',
        specs: ['Híbrido Enchufable', 'Autonomía: 1,200 km', 'Modo EV Intelligente'],
        image: 'https://res.cloudinary.com/djw2gpjal/image/upload/v1771480592/BYD_King_fp6jmn.jpg',
        video: 'https://res.cloudinary.com/djw2gpjal/video/upload/v1771480592/King_Video.mp4',
        color: '#A0A5B1'
    }
];

class UIManager {
    constructor() {
        this.currentStep = 'step-selection';
        this.selectedCar = null;
        this.init();
    }

    init() {
        this.renderCars();
        this.setupEventListeners();
    }

    renderCars() {
        const container = document.getElementById('car-selector');
        container.innerHTML = CAR_DATA.map(car => `
            <div class="car-card" data-id="${car.id}">
                <img src="${car.image}" alt="${car.name}">
                <h3>${car.name}</h3>
                ${car.specs.map(spec => `<p class="car-spec">${spec}</p>`).join('')}
            </div>
        `).join('');

        // Selection event
        container.querySelectorAll('.car-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedCar = CAR_DATA.find(c => c.id === card.dataset.id);
                this.goToStep('step-camera');
                app.startCamera();
            });
        });
    }

    setupEventListeners() {
        document.getElementById('back-to-selection').addEventListener('click', () => {
            this.goToStep('step-selection');
            app.stopCamera();
        });

        document.getElementById('capture-btn').addEventListener('click', () => {
            app.captureAndGenerate();
        });

        document.getElementById('new-gen-btn').addEventListener('click', () => {
            this.goToStep('step-selection');
            window.location.reload(); // Simple reset
        });
    }

    goToStep(stepId) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById(stepId).classList.add('active');
        this.currentStep = stepId;
    }

    showLoading(car) {
        this.goToStep('step-loading');
        if (car.video) {
            const video = document.getElementById('loading-video');
            video.src = car.video;
            video.play();
        }
    }
}

const ui = new UIManager();
