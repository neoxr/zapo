# @neoxr/zapo

`@neoxr/zapo` is a TypeScript connector for building WhatsApp bots on top of [zapo-js](https://www.npmjs.com/package/zapo-js). It creates and manages the WhatsApp connection, forwards client events, serializes incoming and outgoing messages, loads optional plugins, and adds high-level helpers for common message types.

## Table of Contents

- [Quick Start](#quick-start)
- [Connection Options](#connection-options)
- [Session Storage](#session-storage)
- [Events](#events)
- [Message Object](#message-object)
- [Messaging Functions](#messaging-functions)
- [Bot Detection](#bot-detection)
- [Running the Full Bot Base (neoxr-bot)](#running-the-full-bot-base-neoxr-bot)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

Get a working bot that replies to `ping` in about five minutes.

### 1. Requirements

- Node.js 20 or newer (LTS recommended)
- FFmpeg installed and available in your `PATH` (needed for stickers, voice notes and video helpers)
- A WhatsApp account to use as the bot number

### 2. Create a project and install

```bash
mkdir my-bot && cd my-bot
npm init -y
npm install @neoxr/zapo
```

The examples below use ES modules, so add this to your `package.json`:

```json
{
  "type": "module"
}
```

### 3. Create `index.js`

```javascript
import { Client } from '@neoxr/zapo'

const waSocket = new Client({
   plugsdir: 'plugins',
   presence: true,
   online: true,
   pairing: {
      state: true, // set to false to log in with a QR code instead
      number: '6285xxxxxxx' // bot number with country code, no "+" or spaces
   },
   create_session: { type: 'sqlite', session: 'bot-session' },
   custom_id: 'neoxr',
   engines: [], // optional: add store / voip engines here
   debug: false
})

waSocket.on('connect', () => console.log('Connecting to WhatsApp...'))
waSocket.on('ready', () => console.log('Bot is ready!'))
waSocket.on('error', error => console.error(error))

waSocket.on('message', async ctx => {
   if (ctx.fromMe) return
   if (ctx.text?.toLowerCase() === 'ping') {
      await waSocket.sock.reply(ctx.chat, 'Pong!', ctx)
   }
})
```

### 4. Run

```bash
node index.js
```

### 5. Link your WhatsApp account

- **Pairing code** (`pairing.state: true`): the console prints an 8-character code. On your phone open **WhatsApp > Linked devices > Link a device > Link with phone number instead** and enter it. You can choose your own code by setting `pairing.code` to 8 alphanumeric characters (for example `NEOXRBOT`).
- **QR code** (`pairing.state: false`): scan the QR code printed in the console from **WhatsApp > Linked devices > Link a device**.

After linking, send `ping` to the bot number. It should answer `Pong!`.

> The session is saved by `create_session`. As long as the session file or database is kept, you do not have to pair again on the next start. Delete it to log in with a different number.

### 6. Keep it running (optional)

```bash
npm install -g pm2
pm2 start index.js --name neoxr-bot
pm2 save
pm2 logs neoxr-bot
```

### Next steps

- Add commands as plugins in the `plugins` folder (see the `plugsdir` option).
- Browse the [Messaging Functions](#messaging-functions) to send images, stickers, buttons and more.
- Want a ready-made bot with downloader, group management and utilities? See [Running the Full Bot Base](#running-the-full-bot-base-neoxr-bot).

---

## Connection Options

The following is the default configuration used when initializing a new Zapo connection. It covers session management, plugin loading and bot-specific behavior.

```typescript
type SessionType = 'mongo' | 'postgres' | 'local' | 'mysql' | 'sqlite' | 'redis'

export interface ConnectionOpts {
   online?: boolean,
   presence?: boolean,
   stealth?: string,
   custom_id: string,
   pairing?: {
      state: boolean,
      number: string,
      code?: string
   },
   multiple?: boolean,
   create_session?: {
      type: SessionType,
      session: string,
      config?: any,
      number?: string | number,
      owner?: string | number
   },
   setting?: any,
   engines: any[],
   debug: boolean,
}
```

| Option | Type | Description |
| --- | --- | --- |
| `plugsdir` | `string` | Folder that contains your plugins. |
| `online` | `boolean` | Mark the bot as online after connecting. |
| `presence` | `boolean` | Receive and emit presence updates. |
| `stealth` | `string` | Pretend to be another device to avoid bot detection. One of `ios`, `android`, `web`, `desktop`. |
| `custom_id` | `string` | Identifier for this bot instance. Required. |
| `pairing.state` | `boolean` | `true` for pairing code, `false` for QR scan. |
| `pairing.number` | `string` | Bot number with country code. |
| `pairing.code` | `string` | Optional custom pairing code (8 alphanumeric characters). |
| `multiple` | `boolean` | Allow several bot sessions in one process. |
| `create_session` | `object` | Where and how the session is stored. See [Session Storage](#session-storage). |
| `setting` | `any` | Extra settings passed to your bot. |
| `engines` | `any[]` | Optional engines such as `store` or `voip`. Use `[]` if you do not need them. |
| `debug` | `boolean` | Print internal logs. Set to `true` to see how the module works. |

Full example with all common options:

```javascript
import { Client, Utils, Config } from '@neoxr/zapo'

const waSocket = new Client({
   plugsdir: 'plugins',
   presence: true,
   online: true,
   pairing: {
      state: true,
      number: '6285xxxxxxx',
      code: 'NEOXRBOT'
   },
   create_session: { type: 'sqlite', session: 'bot-session' },
   // stealth: 'ios',
   custom_id: 'neoxr',
   engines: [store, voip], // only if you have initialized them
   debug: false
})
```

---

## Session Storage

`create_session.type` decides where the login session is kept:

| Type | Typical use |
| --- | --- |
| `local` | Plain files in a local folder. Simplest option for development. |
| `sqlite` | Single-file database. Good default for one bot on one server. |
| `mysql` / `postgres` | Shared SQL database, useful for several instances. |
| `mongo` | MongoDB, for example a hosted Atlas cluster. |
| `redis` | Fast in-memory storage, for example on ephemeral hosting. |

For anything other than `local` and `sqlite`, pass the connection details in `create_session.config`.

---

## Events

### Built-in events

```javascript
waSocket.on('connect', () => console.log('connecting'))
waSocket.on('error', error => console.log(error))
waSocket.on('ready', () => console.log('ready'))
waSocket.on('stories', ctx => console.log(ctx))
waSocket.on('message', ctx => console.log(ctx))
waSocket.on('message.delete', ctx => console.log(ctx))
waSocket.on('group.add', ctx => console.log(ctx))
waSocket.on('group.remove', ctx => console.log(ctx))
waSocket.on('group.promote', ctx => console.log(ctx))
waSocket.on('group.demote', ctx => console.log(ctx))
waSocket.on('group.request', ctx => console.log(ctx))
waSocket.on('presence', ctx => console.log(ctx))
```

### Event piping

You can also listen to the raw events emitted by zapo-js through `waSocket.ev`:

```javascript
waSocket.ev.on('voip_call_incoming', update => console.log(update))
waSocket.ev.on('voip_call_state', update => console.log(update))
waSocket.ev.on('voip_call_ended', update => console.log(update))
waSocket.ev.on('voip_call_error', update => console.log(update))
waSocket.ev.on('voip_call_outbound_audio_finished', update => console.log(update))
waSocket.ev.on('voip_call_inbound_video', update => console.log(update))
waSocket.ev.on('voip_call_inbound_video_rtp', update => console.log(update))
waSocket.ev.on('message', update => console.log(update))
waSocket.ev.on('message_send', update => console.log(update))
waSocket.ev.on('message_addon', update => console.log(update))
waSocket.ev.on('message_protocol', update => console.log(update))
waSocket.ev.on('message_bot_chunk', update => console.log(update))
waSocket.ev.on('message_unavailable', update => console.log(update))
waSocket.ev.on('receipt', update => console.log(update))
waSocket.ev.on('presence', update => console.log(update))
waSocket.ev.on('chatstate', update => console.log(update))
waSocket.ev.on('call', update => console.log(update))
waSocket.ev.on('group', update => console.log(update))
waSocket.ev.on('newsletter', update => console.log(update))
waSocket.ev.on('newsletter_message_update', update => console.log(update))
waSocket.ev.on('business', update => console.log(update))
waSocket.ev.on('picture', update => console.log(update))
waSocket.ev.on('privacy', update => console.log(update))
waSocket.ev.on('blocklist', update => console.log(update))
waSocket.ev.on('own_username', update => console.log(update))
waSocket.ev.on('mutation', update => console.log(update))
waSocket.ev.on('mutation_send', update => console.log(update))
waSocket.ev.on('history_sync_chunk', update => console.log(update))
waSocket.ev.on('group_history_bundle', update => console.log(update))
waSocket.ev.on('offline_resume', update => console.log(update))
waSocket.ev.on('offline_thread_metadata', update => console.log(update))
waSocket.ev.on('mex_notification', update => console.log(update))
waSocket.ev.on('stream_failure', update => console.log(update))
waSocket.ev.on('stanza_error', update => console.log(update))
```

---

## Message Object

Every `message` event gives you a serialized message (`m` or `ctx`). Commonly used fields:

| Field | Description |
| --- | --- |
| `m.chat` | Chat JID where the message was sent. |
| `m.sender` | Sender JID (phone-number form). |
| `m.text` | Text content of the message. |
| `m.mtype` | Message type, for example `extendedTextMessage`. |
| `m.isGroup` | `true` when sent in a group. |
| `m.fromMe` | `true` when sent by the bot itself. |
| `m.quoted` | The quoted message, or `null`. |
| `m.mentionedJid` | List of mentioned JIDs. |
| `m.key` | Message key (`remoteJid`, `id`, `fromMe`, `participant`, ...). |
| `m.reply(...)` | Reply to the message. |
| `m.react(...)` | React to the message. |
| `m.download()` | Download attached media. |

Example of a full object (group text message):

```javascript
{
   rawNode: {
      tag: 'message',
      attrs: {
         from: '120363418787692501@g.us',
         type: 'text',
         id: 'A512151D2087CBD787C23C1129D69EE5',
         participant: '8792385306797@lid',
         sts: '1790580592042831',
         offline: '0',
         verified_level: 'high',
         notify: 'Neoxr Creative',
         addressing_mode: 'lid',
         expiration: '86400',
         verified_name: '4892374714914454331',
         participant_pn: '6285887776722@s.whatsapp.net',
         t: '1790580591'
      },
      content: [[Object], [Object], [Object], [Object]]
   },
   key: {
      remoteJid: '120363418787692501@g.us',
      id: 'A512151D2087CBD787C23C1129D69EE5',
      fromMe: false,
      isGroup: true,
      isBroadcast: false,
      isNewsletter: false,
      participantAlt: '6285887776722@s.whatsapp.net',
      senderDevice: 0,
      participant: '8792385306797@lid'
   },
   stanzaType: 'text',
   offline: true,
   timestampSeconds: 1790580591,
   expirationSeconds: 86400,
   pushName: 'Neoxr Creative',
   message: {
      extendedTextMessage: {
         endCardTiles: [],
         text: '=> m',
         previewType: 0,
         contextInfo: [Object],
         inviteLinkGroupTypeV2: 0
      },
      messageContextInfo: {
         threadId: [],
         messageSecret: [Uint8Array],
         botMetadata: [Object]
      }
   },
   id: 'A512151D2087CBD787C23C1129D69EE5',
   isBot: false,
   fromMe: false,
   chat: '120363418787692501@g.us',
   sender: '6285887776722@s.whatsapp.net',
   isGroup: true,
   mtype: 'extendedTextMessage',
   quoted: null,
   mentionedJid: [],
   expiration: 86400,
   text: '=> m',
   reply: [Function],
   react: [AsyncFunction],
   download: [AsyncFunction]
}
```

---

## Messaging Functions

All helpers live on the socket client:

```javascript
const client = waSocket.sock
```

### Text and reactions

```javascript
// relay a raw message (like Baileys)
client.relayMessage(m.chat, {
   extendedTextMessage: { text: 'Hi' }
}, {
   additionalAttributes: {},
   additionalNodes: [],
   ...options
})

// send a text message (auto tagged)
client.reply(m.chat, 'Test!', m)

// send a reaction
client.sendReact(m.chat, '💀', m.key)

// send a text message with a custom thumbnail
client.sendMessageModify(m.chat, 'Test!', m, {
   title: '© neoxr-bot',
   largeThumb: true,
   ads: false,
   thumbnail: 'https://iili.io/HP3ODj2.jpg', // Buffer or URL
   url: 'https://chat.whatsapp.com/HYknAquOTrECm9KPJJQO1V'
})

// same, as a link preview
client.sendMessageModify(m.chat, 'Test!', m, {
   title: '© neoxr-bot',
   largeThumb: true,
   type: 'preview-link',
   ratio: 'landscape', // landscape (default), portrait, square
   thumbnail: 'https://iili.io/HP3ODj2.jpg', // Buffer or URL
   url: 'https://chat.whatsapp.com/HYknAquOTrECm9KPJJQO1V'
})
```

### Files and media

All file helpers accept a path, URL or Buffer, and detect the extension automatically.

```javascript
// send a file
client.sendFile(m.chat, 'https://iili.io/HP3ODj2.jpg', 'image.jpg', 'Test!', m)

// send as a document
client.sendFile(m.chat, 'https://iili.io/HP3ODj2.jpg', 'image.jpg', 'Test!', m, {
   document: true
})

// send a live photo (video source)
client.sendFile(m.chat, 'https://cdn.videy.co/7QUk0zRO1.mp4', 'video.mp4', 'Test!', m, {
   photo_live: true,
   // thumbnail: Buffer | URL | Path
})

// send a voice note
client.sendFile(m.chat, './media/audio/ah.mp3', '', '', m, {
   ptt: true
})

// send audio with a cover image in the audio tag
client.sendFile(m.chat, './media/audio/ah.mp3', '', '', m, {
   audio_tag: {
      APIC: coverBuffer // Buffer
   }
})

// send a PTV (round video) message, 10 seconds max
client.sendPtv(m.chat, './media/video/yemete.mp4')

// send an album
client.sendAlbumMessage(m.chat, [{
   url: 'https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg',
   caption: 'Content 1st', // optional
   type: 'image' // optional
}, {
   url: 'https://i.pinimg.com/736x/0b/97/6f/0b976f0a7aa1aa43870e1812eee5a55d.jpg',
   caption: 'Content 2nd',
   type: 'image'
}, {
   url: 'https://i.pinimg.com/736x/8c/6d/db/8c6ddb5fe6600fcc4b183cb2ee228eb7.jpg',
   caption: 'Content 3rd',
   type: 'image'
}], m)
```

### Stickers

Source can be a URL or Buffer.

```javascript
const sticker = {
   packname: 'Sticker by',
   author: '© neoxr.js'
}

client.sendSticker(m.chat, 'https://iili.io/HP3ODj2.jpg', m, sticker)                    // normal
client.sendSticker(m.chat, 'https://iili.io/HP3ODj2.jpg', m, { ...sticker, meta: true })    // AI sticker
client.sendSticker(m.chat, 'https://iili.io/HP3ODj2.jpg', m, { ...sticker, lock: true })    // lock sticker
client.sendSticker(m.chat, 'https://iili.io/HP3ODj2.jpg', m, { ...sticker, premium: true }) // premium sticker
```

### Polls and contacts

```javascript
// poll result
client.pollResult(m.chat, {
   name: 'Demo Poll Result',
   votes: [{
      name: 'Option A',
      count: 1500
   }, {
      name: 'Option B',
      count: 200
   }]
}, m)

// contact card
client.sendContact(m.chat, [{
   name: 'Wildan Izzudin',
   number: '6285887776722',
   about: 'Owner & Creator'
}], m, {
   org: 'Neoxr Network',
   website: 'https://api.neoxr.my.id',
   email: 'contact@neoxr.my.id'
})
```

### Interactive buttons

> Interactive buttons depend on WhatsApp client behavior and may stop working at any time. Use at your own risk.

```javascript
const buttons = [{
   name: 'quick_reply',
   buttonParamsJson: JSON.stringify({
      display_text: 'OWNER',
      id: '.owner'
   }),
}, {
   name: 'cta_url',
   buttonParamsJson: JSON.stringify({
      display_text: 'Rest API',
      url: 'https://api.neoxr.my.id',
      merchant_url: 'https://api.neoxr.my.id'
   })
}, {
   name: 'cta_copy',
   buttonParamsJson: JSON.stringify({
      display_text: 'Copy',
      copy_code: '123456'
   })
}, {
   name: 'cta_call',
   buttonParamsJson: JSON.stringify({
      display_text: 'Call',
      phone_number: '6285887776722'
   })
}, {
   name: 'single_select',
   buttonParamsJson: JSON.stringify({
      title: 'Tap!',
      sections: [{
         rows: [{
            title: 'Owner',
            description: 'X',
            id: '.owner'
         }, {
            title: 'Runtime',
            description: 'Y',
            id: '.run'
         }]
      }]
   })
}]

// buttons and list
client.replyButton(m.chat, buttons, m, {
   header: '',
   content: 'Hi!',
   // v2: true, // product style with image
   type: 'interactive',
   footer: '',
   media: global.db.setting.cover // video or image link
})

// buttons and list (grouped in a single select menu)
client.replyButton(m.chat, buttons, m, {
   header: '',
   content: 'Hi!',
   footer: '',
   media: global.db.setting.cover,
   multiple: {
      name: 'オートメーション',
      code: 'neoxr-bot',
      list_title: 'Select Menu',
      button_title: 'Tap Here!'
   },
   type: 'interactive'
})

// carousel
const cards = [{
   header: {
      image: global.db.setting.cover,
      hasMediaAttachment: true,
   },
   body: { text: 'P' },
   nativeFlowMessage: {
      buttons: [{
         name: 'cta_url',
         buttonParamsJson: JSON.stringify({
            display_text: 'Contact Owner',
            url: 'https://api.neoxr.eu',
            webview_presentation: null
         })
      }]
   }
}, {
   header: {
      image: global.db.setting.cover,
      hasMediaAttachment: true,
   },
   body: { text: 'P' },
   nativeFlowMessage: {
      buttons: [{
         name: 'cta_url',
         buttonParamsJson: JSON.stringify({
            display_text: 'Contact Owner',
            url: 'https://api.neoxr.eu',
            webview_presentation: null
         })
      }]
   }
}]

client.replyButton(m.chat, [], m, {
   title: global.header,
   type: 'interactive',
   content: 'Hi! @0',
   cards
})
```

### Legacy buttons

`text` and `footer` must not be empty.

```javascript
const buttons = [{
   text: 'Runtime',
   command: '.runtime'
}, {
   text: 'Statistic',
   command: '.stat'
}]

// text
client.replyButton(m.chat, buttons, m, {
   text: 'Hi @0',
   footer: global.footer
})

// image or video
client.replyButton(m.chat, buttons, m, {
   text: 'Hi @0',
   footer: global.footer,
   media: global.db.setting.cover
})

// document
client.replyButton(m.chat, buttons, m, {
   text: 'Hi @0',
   footer: global.footer,
   media: global.db.setting.cover, // any file link
   document: {
      filename: 'neoxr.jpg'
   }
})

// location
client.replyButton(m.chat, buttons, m, {
   text: 'Hi @0',
   footer: global.footer,
   media: global.db.setting.cover,
   location: {
      name: global.header,
      description: 'オートメーション'
   }
})

// legacy buttons + native flow
client.replyButton(m.chat, [{
   text: 'Runtime',
   command: '.runtime'
}, {
   name: 'single_select',
   params: {
      title: 'Tap!',
      sections: [{
         rows: [{
            title: 'Runtime',
            description: '---',
            id: '.runtime'
         }, {
            title: 'Statistic',
            description: '---',
            id: '.stat'
         }]
      }]
   }
}], m, {
   text: 'Hi @0',
   footer: global.footer,
   media: global.db.setting.cover
})
```

### Group status

```javascript
// image or video
client.groupStatus(m.chat, {
   media: 'https://i.pinimg.com/736x/0b/97/6f/0b976f0a7aa1aa43870e1812eee5a55d.jpg', // URL or Buffer
   caption: 'Hi!'
})

// audio
client.groupStatus(m.chat, {
   media: 'https://example.com/audio.mp3', // URL or Buffer
   background: '#FF0000'
})

// text
client.groupStatus(m.chat, {
   text: 'Hi!',
   background: '#FF0000',
   color: '#222222'
})

// close friends: add the `private` option to any of the above
client.groupStatus(m.chat, {
   text: 'Hi!',
   background: '#FF0000',
   color: '#222222'
}, {
   private: {
      name: 'Neoxr Creative',
      emoji: '🔥'
   }
})

// instant: forward a quoted message as status
client.groupStatus(m.chat, m.quoted.fakeObj, {
   private: {
      name: 'Neoxr Creative',
      emoji: '🔥'
   }
})
```

### Meta (rich) messages

`sendMetaMsg` takes a list of blocks. Which blocks work depends on the version.

**v1: text with mentions, tables and code**

```javascript
client.sendMetaMsg(m.chat, [{
   text: `Hi @${m.sender.replace(/@.+/, '')} ✨, this is a simple meta message that supports *mentions*, *tables* and *code format*.`
}, {
   code: {
      language: 'javascript',
      code: fs.readFileSync('./error.js', 'utf-8')
   }
}, {
   text: 'And this is an example of a table.'
}, {
   table: {
      title: 'Data',
      headers: ['Code', 'Artist'],
      rows: [
         ['SSID-738', 'Artist A'],
         ['RTXU-849', `@${m.sender.replace(/@.+/, '')}`]
      ]
   }
}, {
   text: 'You can add text, tables and code blocks as you like. 😎'
}], m, {
   title: global.header,
   mentions: [m.sender]
})
```

**v2: citations, links, muted text, suggestions and sources** (no mentions or tables)

```javascript
client.sendMetaMsg(m.chat, [{
   text: 'This meta message supports citations [](https://api.neoxr.eu) and links [Neoxr API](https://api.neoxr.eu).\n\nCode formatting still works:'
}, {
   code: {
      language: 'javascript',
      code: fs.readFileSync('./error.js', 'utf-8')
   }
}, {
   muted: 'There is also muted text like this.'
}, {
   suggestions: ['N', 'E', 'O', 'X', 'R', 'B', 'O', 'T']
}, {
   sources: [{
      icon: 'https://i.pinimg.com/736x/b4/e0/12/b4e012b9e55bc101eb2c89655888e2f1.jpg',
      title: 'Github',
      url: 'https://github.com/neoxr/neoxr-bot'
   }]
}], m, {
   title: global.header
})
```

**v3: reels, posts and products** (no mentions or tables)

```javascript
client.sendMetaMsg(m.chat, [{
   text: 'Photo and video blocks are supported.\n\n---\n\nHere is an example of reels:'
}, {
   reels: [
      'https://i.pinimg.com/736x/48/58/17/485817189f76066e8b22637d1310d3b4.jpg',
      'https://i.pinimg.com/736x/0e/32/e3/0e32e35b0324a541ba7fe705330febde.jpg',
      'https://i.pinimg.com/736x/88/78/b1/8878b18952e3587dd5c7502f35155731.jpg'
   ].map(image => ({
      creator: 'Neoxr Creative',
      avatar: 'https://avatars.githubusercontent.com/u/52621597?v=4',
      verified: true,
      thumbnail: image,
      url: 'https://api.neoxr.eu',
      source: 'IG'
   }))
}, {
   text: '\n\n---\n\nSocial media posts:'
}, {
   posts: [{
      media: 'https://i.pinimg.com/736x/ba/fd/92/bafd92cf5c8fbd802cf59c51286fc13f.jpg',
      caption: 'Caption one',
      source: 'FACEBOOK'
   }, {
      media: 'https://i.pinimg.com/1200x/ec/0a/fd/ec0afd363645fa73d9d17df1136fddd4.jpg',
      caption: 'Caption two',
      source: 'THREADS'
   }, {
      media: 'https://i.pinimg.com/736x/53/dd/f9/53ddf9fcf881b704548f2b6c676b07a6.jpg',
      caption: 'Caption three',
      source: 'INSTAGRAM'
   }].map(v => ({
      username: 'Neoxr Creative',
      avatar: 'https://avatars.githubusercontent.com/u/52621597?v=4',
      verified: true,
      caption: v.caption,
      url: 'https://api.neoxr.eu',
      thumbnail: v.media,
      source: v.source,
      post_type: 'PHOTO'
   }))
}, {
   text: '\n\n---\n\nA single product (no slide):\n\n'
}, {
   products: {
      title: 'Script Selfbot (WhatsApp Bot) [Free Update]',
      image: 'https://imgkub.com/images/2026/01/14/image586735a7ca2a894a.jpg',
      sale_price: 'Rp. 65.000',
      brand: 'Neoxr Creative',
      url: `https://wa.me/${Config.owner}`
   }
}, {
   text: '\n\n---\n\nProducts as a slide:'
}, {
   products: [{
      title: 'Script Premium (WhatsApp Bot) V5.1-Optima',
      image: 'https://imgkub.com/images/2025/12/07/image6e1f9b94ba9ced64.jpg',
      sale_price: 'Rp. 150.000'
   }, {
      title: 'Script E-Commerce (NeoCommerce)',
      image: 'https://imgkub.com/images/2025/12/07/image42981ad8a7441ff7.jpg',
      price: 'Rp. 175.000',
      sale_price: 'Rp. 150.000'
   }, {
      title: 'Script Selfbot (WhatsApp Bot)',
      image: 'https://imgkub.com/images/2026/01/14/image3b73a38fbc0a64c6.jpg',
      sale_price: 'Rp. 55.000'
   }].map(v => ({
      ...v,
      brand: 'Neoxr Creative',
      url: `https://wa.me/${Config.owner}`
   }))
}], m, {
   title: global.header
})
```

---

## Bot Detection

`client.evaluateSignals()` scores a message from 0 to 100 based on signals that bots tend to produce: template-style text, promo text, repeated or evenly timed messages, non-primary devices, custom message IDs, instant replies and more. It returns a verdict so you can decide what to do (warn, ignore, kick).

### Verdicts

| Verdict | Score | Meaning |
| --- | --- | --- |
| `OFFICIAL` | 0 - 24 | No meaningful bot signals. |
| `WARN` | 25 - 59 | Suspicious, but not conclusive. |
| `BOT` | 60 - 100 | Very likely automated. |

### Result

```javascript
{
   success: true,
   verdict: 'BOT',
   score: 100,
   botSignals: ['bot_message_type', 'unknown_id_format'],
   officialSignals: [],
   message: {
      id, chat, sender, fromMe, type,
      senderDevice, deviceName, text, characters, timestamp
   },
   response: {
      quotedMessageId,
      durationSeconds, 
      durationReason
   },
   client: {
      loaded,          // true when a stanza was available
      verdict,         // 'bot' | 'official' | null
      reportingToken
   },
   history: {
      analyzed, skipped, loaded, fromSender, matchedStored,
      textAnalyzed, decorativeTexts, promoTexts,
      automatedTexts, normalTexts, patternMatches
   }
}
```

Reaction, protocol, button-response, list-response and poll-update messages are skipped. They return `ignored: true` with `reason: 'ignored_message_type'`.

If something throws internally, the function does not throw. It returns `{ success: false, error }`, so always check `result.success` first.

### Options

```javascript
await client.evaluateSignals(m, {
   target: 'quoted',
   history: [],
   limit: 300,
   historyMode: 'always',
   stanza: node,
   chat: '120363418787692501@g.us',
   sender: '6285887776722@s.whatsapp.net',
   config: {}
})
```

| Option | Type | Description |
| --- | --- | --- |
| `target` | `'self' \| 'quoted'` | `'self'` (default) scores the message itself. `'quoted'` scores the message that was replied to (`ctx.quoted`). |
| `history` | `any[]` | Your own message history. When omitted, history is loaded from the store (`loadMessages`). |
| `limit` | `number` | How many messages to load from the store. Defaults to `config.MAX_HISTORY`. |
| `historyMode` | `'always' \| 'auto'` | By default history analysis is skipped when the sender uses the primary device. `'always'` forces it. |
| `stanza` | `object` | Raw message stanza. When omitted, it is loaded from the store (`loadNode`). |
| `chat` | `string` | Fallback chat JID when the message does not carry one. |
| `sender` | `string` | Fallback sender JID when the message does not carry one. |
| `config` | `SignalConfig` | Override thresholds and scores for this call. See below. |

The store used is the first entry of `engines`, or the built-in memory store when none is given. If it does not implement `loadMessages`, `loadMessage` or `loadNode`, history and stanza are empty and scoring is less accurate. Pass `history` and `stanza` yourself in that case.

### Overriding the configuration

Every threshold and score can be overridden, either for one call or globally.

```javascript
// one call
await client.evaluateSignals(m, {
   config: {
      SIMILAR_THRESHOLD: 0.85,
      DEVICE_SCORE: 30,
      FREQUENCY_WINDOW_SECONDS: 5,
      IGNORED_TYPES: { remove: ['reactionMessage'] },
      BOT_MESSAGE_TYPES: { add: ['carouselMessage'] }
   }
})

// every call
client.evaluateSignals.config = {
   HUMAN_DISCOUNT: 20,
   MAX_HISTORY: 300
}

// read the defaults
console.log(client.evaluateSignals.defaults)
```

Priority, lowest to highest: built-in defaults, then `client.evaluateSignals.config`, then `options.config`.

Unknown keys, and values with the wrong type (for example a string where a number is expected), are ignored.

| Key | Default | Description |
| --- | --- | --- |
| `FREQUENCY_WINDOW_SECONDS` | `10` | Window used to count burst messages (5 or more inside it is flagged). |
| `REPEAT_WINDOW_SECONDS` | `120` | Window for detecting identical repeated messages. |
| `SIMILAR_WINDOW_SECONDS` | `86400` | Window for detecting messages that follow the same template. |
| `SIMILAR_THRESHOLD` | `0.75` | Similarity (0 - 1) at which two messages count as the same template. |
| `SIMILAR_MIN_TOKENS` | `8` | Minimum tokens before token similarity is evaluated. |
| `SIMILAR_MIN_LINES` | `3` | Minimum lines before line similarity is evaluated. |
| `MAX_HISTORY` | `500` | Maximum history messages per sender. |
| `HUMAN_DISCOUNT` | `15` | Behavior score subtracted when the text and history look normal. |
| `DEVICE_SCORE` | `25` | Score added for a non-primary device. |
| `HISTORY_TEXT_WINDOW` | `50` | Number of recent texts analyzed from history. |
| `HISTORY_RATIO` | `0.3` | Share of history texts that must match a pattern to count as a history signal. |
| `HISTORY_NORMAL_RATIO` | `0.9` | Share of history texts that must look normal to apply `HUMAN_DISCOUNT`. |
| `HISTORY_NORMAL_MIN` | `5` | Minimum analyzed texts before the normal-history check applies. |
| `REGULAR_MIN_GAPS` | `6` | Minimum message gaps before evenly timed messages are flagged. |
| `STANZA_SCORE` | `60` | Score added when the stanza has no reporting token. |
| `INSTANT_REPLY_SCORE` | `35` | Score added for a reply sent within 1 second of the quoted message. |
| `IGNORED_CLIENT_TOKEN` | `'ignored_type'` | Value reported as `client.reportingToken` for ignored message types. |
| `IGNORED_TYPES` | see below | Message types that are skipped. |
| `BOT_MESSAGE_TYPES` | see below | Message types that immediately mark a message as a bot message. |

`IGNORED_TYPES` defaults to `reactionMessage`, `protocolMessage`, `interactiveResponseMessage`, `buttonsResponseMessage`, `templateButtonReplyMessage`, `listResponseMessage`, `pollUpdateMessage`, `senderKeyDistributionMessage` and `messageHistoryNotice`.

`BOT_MESSAGE_TYPES` defaults to `buttonsMessage`, `templateMessage`, `interactiveMessage`, `listMessage` and `highlyStructuredMessage`.

For these two keys you can pass:

| Value | Effect |
| --- | --- |
| `['a', 'b']` or `new Set([...])` | Replaces the whole list. |
| `{ add: ['a'] }` | Adds to the defaults. |
| `{ remove: ['a'] }` | Removes from the defaults. |
| `{ add: [...], remove: [...] }` | Both. |

### Tips

- Run it on messages from other users only (`if (m.fromMe) return`).
- A single `WARN` is weak evidence. Act on `BOT`, or on repeated `WARN` results from the same sender.
- Lower `SIMILAR_THRESHOLD` catches more template variations but raises false positives.

---

## Running the Full Bot Base (neoxr-bot)

If you prefer a ready-made bot (downloader, group management and utilities) instead of starting from scratch, use the [neoxr-bot `5.0-ZAPO` branch](https://github.com/neoxr/neoxr-bot/tree/5.0-ZAPO), which is built on this library.

```bash
git clone -b 5.0-ZAPO https://github.com/neoxr/neoxr-bot
cd neoxr-bot
npm install
```

Fill in your bot number and settings in the configuration files, then start it:

```bash
# direct
npm start

# or with pm2
pm2 start pm2.config.cjs && pm2 logs neoxr
```

Docker:

```bash
docker build -t bot .
docker run -d --name neoxr bot && docker logs -f neoxr

# stop
docker stop neoxr
```

Some features (such as downloaders) need an API key from [api.neoxr.my.id](https://api.neoxr.my.id). Check the repository's own README for the exact configuration keys of this branch.

---

## Troubleshooting

| Problem | What to try |
| --- | --- |
| Pairing code never appears | Make sure `pairing.state` is `true` and `pairing.number` has the country code with digits only. |
| Asked to pair on every start | The session is not persisted. Check that `create_session` points to a writable location. |
| Stickers, voice notes or video fail | Install FFmpeg and confirm `ffmpeg -version` works in the same shell. |
| `Cannot use import statement outside a module` | Add `"type": "module"` to `package.json` or rename the file to `.mjs`. |
| Bot is logged out or blocked | Avoid spamming and unofficial interactive messages; consider the `stealth` option. |
| Need more detail | Set `debug: true` to see what the library is doing. |