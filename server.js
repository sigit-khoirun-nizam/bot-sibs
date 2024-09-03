const express = require('express');
const WhatsAppClient = require('./whatsapp');

const app = express();
const port = process.env.PORT || 3000;

const whatsappClient = new WhatsAppClient();

app.use(express.json());

app.use(async (req, res, next) => {
    if (!whatsappClient.isAuthenticated && req.path !== '/status' && req.path !== '/reinitialize' && req.path !== '/force-logout') {
        return res.status(503).json({ error: 'WhatsApp client is not ready' });
    }
    next();
});

app.get('/status', (req, res) => {
    res.json(whatsappClient.getStatus());
});

app.post('/send', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
        await whatsappClient.sendMessage(whatsappClient.targetGroupId, message);
        res.json({ success: true, message: 'Message sent to group' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.get('/groups', async (req, res) => {
    try {
        const chats = await whatsappClient.client.getChats();
        const groups = chats.filter(chat => chat.isGroup).map(group => ({
            name: group.name,
            id: group.id._serialized
        }));
        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

app.post('/reinitialize', async (req, res) => {
    try {
        await whatsappClient.handleLogout();
        res.json({ success: true, message: 'WhatsApp client reinitialized' });
    } catch (error) {
        console.error('Error reinitializing WhatsApp client:', error);
        res.status(500).json({ error: 'Failed to reinitialize WhatsApp client' });
    }
});

app.post('/force-logout', async (req, res) => {
    try {
        await whatsappClient.forceLogout();
        res.json({ success: true, message: 'Forced logout initiated. Check console for QR code.' });
    } catch (error) {
        console.error('Error forcing logout:', error);
        res.status(500).json({ error: 'Failed to force logout' });
    }
});

whatsappClient.initialize().then(() => {
    console.log('WhatsApp client initialized');
    app.listen(port, () => {
        console.log(`Express server is running on port ${port}`);
    });
}).catch(error => {
    console.error('Failed to initialize WhatsApp client:', error);
});