const { proto, generateWAMessage,  areJidsSameUser } = require('@adiwajshing/baileys-md')
//const util = require('util')

module.exports = {
    async all(m, chatUpdate) {
        if (m.isBaileys) return
        if (!m.message) return 
        if (!(m.message.buttonsResponseMessage || m.message.templateButtonReplyMessage)) return
        let id = m.message.buttonsResponseMessage?.selectedButtonId || m.message.templateButtonReplyMessage?.selectedId
        let text = m.message.buttonsResponseMessage?.selectedDisplayText || m.message.templateButtonReplyMessage?.selectedDisplayText
        let isIdMessage = false, usedPrefix
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin) continue
            if (plugin.disabled) continue
            if (!opts['restrict']) if (plugin.tags && plugin.tags.includes('admin')) continue
            if (typeof plugin !== 'function') continue
            if (!plugin.command) continue
            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
            let match = (_prefix instanceof RegExp ? 
                [[_prefix.exec(id), _prefix]] :
                Array.isArray(_prefix) ? 
                    _prefix.map(p => {
                        let re = p instanceof RegExp ? // 
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(id), re]
                    }) :
                    typeof _prefix === 'string' ? 
                        [[new RegExp(str2Regex(_prefix)).exec(id), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = id.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                command = (command || '').toLowerCase()
                let isId = plugin.command instanceof RegExp ? 
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ? 
                        plugin.command.some(cmd => cmd instanceof RegExp ?
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof plugin.command === 'string' ? 
                            plugin.command === command :
                            false
                if (!isId) continue
                console.log({ name, command: plugin.command, text: id })
                isIdMessage = true
            }

        }
        let messages = await generateWAMessage(m.chat, { text: isIdMessage ? id : text, mentions: m.mentionedJid }, {
            userJid: this.user.id,
            quoted: m.quoted && m.quoted.fakeObj
        })
        messages.key.fromMe = areJidsSameUser(m.sender, this.user.id)
        messages.key.id = m.key.id
        messages.pushName = m.name
        if (m.isGroup) messages.participant = m.sender
        let msg = {
            ...chatUpdate,
            messages: [proto.WebMessageInfo.fromObject(messages)],
            type: 'append'
        }
        this.ev.emit('messages.upsert', msg)
    }
}