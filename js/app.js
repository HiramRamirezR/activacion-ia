class AppManager {
    constructor() {
        this.webcamElement = document.getElementById('webcam');
        this.canvasElement = document.getElementById('photo-canvas');
        this.stream = null;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 1280, height: 720 },
                audio: false
            });
            this.webcamElement.srcObject = this.stream;
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    async captureAndGenerate() {
        // 1. Capture frame
        const context = this.canvasElement.getContext('2d');
        this.canvasElement.width = this.webcamElement.videoWidth;
        this.canvasElement.height = this.webcamElement.videoHeight;
        context.drawImage(this.webcamElement, 0, 0);

        const imageData = this.canvasElement.toDataURL('image/jpeg', 0.8);
        this.stopCamera();

        // 2. Show loading experience
        ui.showLoading(ui.selectedCar);

        // 3. Call Generation Function
        try {
            const response = await fetch('/.netlify/functions/generate', {
                method: 'POST',
                body: JSON.stringify({
                    imageData: imageData,
                    carId: ui.selectedCar.id,
                    carName: ui.selectedCar.name
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showResult(result.imageUrl, result.id);
            } else {
                throw new Error(result.message || 'Error en la generación');
            }
        } catch (err) {
            console.error(err);
            alert("Hubo un error al generar tu imagen. Por favor intenta de nuevo.");
            ui.goToStep('step-selection');
        }
    }

    showResult(imageUrl, id) {
        ui.goToStep('step-result');
        document.getElementById('generated-image').src = imageUrl;

        // Generate QR
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: `${window.location.origin}/share.html?id=${id}`,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });
    }
}

const app = new AppManager();
