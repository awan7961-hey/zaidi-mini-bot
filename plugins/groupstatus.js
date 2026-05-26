// ==================== GROUP STATUS PLUGIN ====================
// Command: .groupstatus (reply to any media or text)

const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    name: 'groupstatus',
    pattern: 'groupstatus',
    alias: ['gstatus', 'setstatus'],
    react: '📱',
    category: 'group',
    desc: 'Set replied media/text as group status',
    use: '.groupstatus (reply to image/video/text)',
    async function(conn, message, m, { from, isGroup, isAdmins, reply, args, q, quoted }) {
        
        // Check group
        if (!isGroup) {
            return reply('❌ This command can only be used in groups.');
        }
        
        // Check admin
        if (!isAdmins) {
            return reply('❌ Only group admins can set group status.');
        }
        
        try {
            const quotedMsg = m.quoted;
            let statusCaption = q || '';
            
            // Text only
            if (!quotedMsg && statusCaption) {
                await conn.updateGroupStatus(from, statusCaption);
                return reply(`✅ *Group Status Updated!*\n\n📝 Status: ${statusCaption}`);
            }
            
            // No quoted message
            if (!quotedMsg && !q) {
                return reply(`📌 *How to use:*\n\nReply to image/video with: .groupstatus caption here\n\nExample: Reply to photo with .groupstatus Hello everyone!`);
            }
            
            // Handle quoted media
            if (quotedMsg) {
                const contentType = Object.keys(quotedMsg)[0];
                
                // Image
                if (contentType === 'imageMessage') {
                    reply('⏳ Downloading image...');
                    const mediaBuffer = await conn.downloadMediaMessage(quotedMsg.imageMessage);
                    await conn.sendMessage(from, { image: mediaBuffer, caption: statusCaption });
                    return reply(`✅ *Group Status Posted!*\n\n🖼️ Image posted\n📝 ${statusCaption || 'No caption'}`);
                }
                
                // Video
                if (contentType === 'videoMessage') {
                    reply('⏳ Downloading video...');
                    const mediaBuffer = await conn.downloadMediaMessage(quotedMsg.videoMessage);
                    await conn.sendMessage(from, { video: mediaBuffer, caption: statusCaption });
                    return reply(`✅ *Group Status Posted!*\n\n🎥 Video posted\n📝 ${statusCaption || 'No caption'}`);
                }
                
                // Text message quoted
                if (contentType === 'extendedTextMessage' && quotedMsg.extendedTextMessage?.text) {
                    statusCaption = quotedMsg.extendedTextMessage.text + (q ? '\n\n' + q : '');
                    await conn.updateGroupStatus(from, statusCaption);
                    return reply(`✅ *Group Status Updated!*\n\n📝 ${statusCaption.slice(0, 100)}`);
                }
                
                // Conversation quoted
                if (contentType === 'conversation') {
                    statusCaption = quotedMsg.conversation + (q ? '\n\n' + q : '');
                    await conn.updateGroupStatus(from, statusCaption);
                    return reply(`✅ *Group Status Updated!*\n\n📝 ${statusCaption.slice(0, 100)}`);
                }
                
                reply('❌ Unsupported! Reply to image, video, or text message.');
            }
            
        } catch (error) {
            console.error('Group Status Error:', error);
            reply(`❌ Error: ${error.message}`);
        }
    }
};
