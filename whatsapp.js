const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppClient {
    constructor() {
        // Inisialisasi client WhatsApp dengan LocalAuth dan pengaturan puppeteer
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox', 
                    '--disable-extensions', 
                    '--disable-dev-shm-usage'
                ],
                headless: true,  // Menggunakan headless mode untuk stabilitas lebih
            }
        });

        // Panggil metode untuk menginisialisasi event listener
        this.initializeClient();
    }

    initializeClient() {
        // Event untuk menampilkan QR code di terminal
        this.client.on('qr', (qr) => {
            console.log('QR RECEIVED');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('navigation', (navigation) => {
          console.log('Navigation event:', navigation);
          // Handle the navigation event here
        });

        // Event ketika client sudah siap digunakan
        this.client.on('ready', () => {
            console.log('Client is ready!');
        });

        // Event ketika client berhasil diautentikasi
        this.client.on('authenticated', () => {
            console.log('Client is authenticated!');
        });

        // Event ketika terjadi kegagalan autentikasi
        this.client.on('auth_failure', (msg) => {
            console.error('Authentication failure:', msg);
        });

        // Event ketika client terputus
        this.client.on('disconnected', (reason) => {
            console.log('Client was disconnected:', reason);
            // Opsional: Restart client jika diperlukan
            this.client.initialize();
        });

        // Event untuk menangani perubahan status
        this.client.on('change_state', (state) => {
            console.log('Change state:', state);
        });

        // Event untuk menangani pesan yang masuk
        this.client.on('message', async (message) => {
            try {
                const from = message.from;
                const to = '1234567890-1234567890@g.us';  // Ganti dengan ID grup Anda
                await this.sendMessage(to, `Pesan dari ${from}: ${message.body}`);
            } catch (error) {
                console.error('Failed to handle message:', error);
            }
        });
    }

    // Metode untuk menginisialisasi client
    async initialize() {
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('Error during client initialization:', error);
        }
    }

    // Metode untuk mengirim pesan ke kontak atau grup
    async sendMessage(to, message) {
        try {
            await this.client.sendMessage(to, message);
            console.log('Message sent successfully');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    // Metode untuk menambahkan event listener pada pesan yang masuk
    onMessage(callback) {
        this.client.on('message', callback);
    }
}

module.exports = WhatsAppClient;
