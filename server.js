const express = require('express');
const WhatsAppClient = require('./whatsapp');

// Inisialisasi express
const app = express();
const port = process.env.PORT || 3000;

// Inisialisasi WhatsApp client
const whatsappClient = new WhatsAppClient();

// Menunggu sampai WhatsApp client siap
whatsappClient.initialize().then(() => {
    console.log('WhatsApp client initialized');
    
    // Jika ada pesan yang masuk, teruskan ke grup
    whatsappClient.onMessage(async (message) => {
        try {
            const from = message.from;
            const to = '1234567890-1234567890@g.us';  // Ganti dengan ID grup Anda

            // Kirim pesan yang diterima ke grup
            await whatsappClient.sendMessage(to, `Pesan dari ${from}: ${message.body}`);
        } catch (error) {
            console.error('Error forwarding message:', error);
        }
    });
});

// Mulai server express
app.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
});
