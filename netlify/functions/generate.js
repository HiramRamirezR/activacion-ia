const { GoogleGenAI } = require("@google/genai");
const admin = require('firebase-admin');

// Initialize Firebase Admin for the activation project
if (!admin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } else {
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
    }

    admin.initializeApp({
        credential,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { imageData, carId, carName } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI(apiKey);
        const model = 'gemini-2.5-flash-image';

        // 1. Prepare Image Data
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = imageData.match(/^data:([^;]+);/)?.[1] || 'image/jpeg';

        console.log(`Generando experiencia BYD para ${carName}...`);

        // 2. Call Gemini AI
        const prompt = `Generate a tight close-up professional automotive shot of a ${carName} from a side-angle exterior perspective. The framing should be focused on the front half of the car and the driver. Through the side window, the person from the photo must be clearly visible and easily recognizable, showing a massive, joyful smile of pure excitement. Use a shallow depth of field (bokeh) to heavily blur the background. The car design must be 100% accurate to the official BYD ${carName} model. Premium cinematic lighting, high-end commercial photography style, 8k resolution. No text or logos on the windows or background.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: [{
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: prompt }
                ]
            }]
        });

        const candidate = response.candidates?.[0];
        let generatedBase64 = null;

        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    generatedBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (!generatedBase64) {
            return {
                statusCode: 422,
                body: JSON.stringify({ success: false, message: 'No se pudo generar la imagen' })
            };
        }

        // 3. Persist to Firebase Storage
        const id = Math.random().toString(36).substring(2, 9);
        const fileName = `byd_activations/${id}.png`;
        const file = bucket.file(fileName);
        const buffer = Buffer.from(generatedBase64, 'base64');

        await file.save(buffer, {
            metadata: { contentType: 'image/png' },
            public: true
        });

        // Get public URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '01-01-2100'
        });

        // 4. Save to Firestore
        await db.collection('byd_activations').doc(id).set({
            id: id,
            carId: carId,
            carName: carName,
            generatedImageUrl: url,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                imageUrl: url,
                id: id
            })
        };

    } catch (err) {
        console.error('Error in generation:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
};
