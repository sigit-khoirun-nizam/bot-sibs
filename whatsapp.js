const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');

class WhatsAppClient {
    constructor() {
        this.isAuthenticated = false;
        this.qrCodeDisplayed = false;
        this.initClient();
    }

    initClient() {
        console.log('Initializing WhatsApp client...');
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: path.join(process.cwd(), '.wwebjs_auth')
            }),
            puppeteer: {
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox', 
                    '--disable-extensions', 
                    '--disable-dev-shm-usage'
                ],
                headless: true,
            }
        });

        this.targetGroupId = '120363332560457535@g.us'; // Default group ID
        this.initializeClient();
    }

    initializeClient() {
        this.client.on('qr', (qr) => {
            console.log('New QR RECEIVED. Scan the QR code below:');
            qrcode.generate(qr, { small: true });
            this.qrCodeDisplayed = true;
            this.isAuthenticated = false;
        });

        this.client.on('ready', () => {
            console.log('Client is ready!');
            this.isAuthenticated = true;
            this.qrCodeDisplayed = false;
        });

        this.client.on('authenticated', () => {
            console.log('Client is authenticated!');
            this.isAuthenticated = true;
            this.qrCodeDisplayed = false;
        });

        this.client.on('auth_failure', async (msg) => {
            console.error('Authentication failure:', msg);
            this.isAuthenticated = false;
            await this.handleLogout();
        });

        this.client.on('disconnected', async (reason) => {
            console.log('Client was disconnected:', reason);
            this.isAuthenticated = false;
            await this.handleLogout();
        });

        this.client.on('message', async (message) => {
            console.log('Message received:', message.body, 'from:', message.from);
            
            if (message.body.toLowerCase() === '!getgroupid') {
                await this.sendGroupList(message.from);
            } else if (message.from !== this.targetGroupId) {
                await this.forwardMessage(message);
            }
        });
    }

    async handleLogout() {
        console.log('Handling logout...');
        try {
            // Ensure the client is destroyed
            if (this.client) {
                await this.client.destroy();
                console.log('Client destroyed');
            }

            // Wait for a moment to ensure all processes are complete
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Delete session folder
            const sessionDir = path.join(process.cwd(), '.wwebjs_auth');
            await this.deleteFolderRecursive(sessionDir);
            console.log('Session folder deleted');
            
            // Reset status
            this.isAuthenticated = false;
            this.qrCodeDisplayed = false;
            
            // Reinitialize client
            this.initClient();
            await this.initialize();
        } catch (error) {
            console.error('Error handling logout:', error);
            // If deletion fails, try to reinitialize without deleting
            this.initClient();
            await this.initialize();
        }
    }

    async deleteFolderRecursive(folderPath) {
        try {
            await fs.rm(folderPath, { recursive: true, force: true });
        } catch (error) {
            console.error(`Error deleting folder ${folderPath}:`, error);
        }
    }

    async initialize() {
        console.log('Initializing client...');
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('Error during client initialization:', error);
            // If initialization fails, try to reinitialize
            await this.handleLogout();
        }
    }

    async sendMessage(to, message) {
        try {
            await this.client.sendMessage(to, message);
            console.log('Message sent successfully to:', to);
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error; // Propagate the error for better handling in calling functions
        }
    }

    async forwardMessage(message) {
        try {
            await this.sendMessage(this.targetGroupId, `${message.body}`);
            console.log('Message forwarded to group');
        } catch (error) {
            console.error('Failed to forward message:', error);
        }
    }

    async sendGroupList(to) {
        try {
            const chats = await this.client.getChats();
            const groups = chats.filter(chat => chat.isGroup);
            
            if (groups.length > 0) {
                let groupList = 'Daftar Grup yang Sudah Di-join:\n\n';
                groups.forEach((group, index) => {
                    groupList += `${index + 1}. Nama: ${group.name}\nID: ${group.id._serialized}\n\n`;
                });
                await this.sendMessage(to, groupList);
            } else {
                await this.sendMessage(to, 'Anda belum bergabung dengan grup apapun.');
            }
        } catch (error) {
            console.error('Failed to send group list:', error);
        }
    }

    getStatus() {
        return {
            isReady: this.client && this.client.pupPage ? true : false,
            isAuthenticated: this.isAuthenticated,
            targetGroupId: this.targetGroupId
        };
    }

    async forceLogout() {
        console.log('Forcing logout...');
        await this.handleLogout();
    }
}

module.exports = WhatsAppClient;