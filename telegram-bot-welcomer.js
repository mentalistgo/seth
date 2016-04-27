const TelegramBotWebHook = require('./telegramWebHook');
const TelegramBotPolling = require('./telegramPolling');
const debug = require('debug')('node-telegram-bot-api');
const EventEmitter = require('eventemitter3');
const fileType = require('file-type');
const Promise = require('bluebird');
const request = require('request-promise');
const streamedRequest = require('request');
const qs = require('querystring');
const stream = require('stream');
const mime = require('mime');
const path = require('path');
const URL = require('url');
const fs = require('fs');
const pump = require('pump');

class TelegramBot extends EventEmitter {

  // Telegram message events
  static messageTypes = [
    'text', 'audio', 'document', 'photo', 'sticker', 'video', 'voice', 'contact',
    'location', 'new_chat_participant', 'left_chat_participant', 'new_chat_title',
    'new_chat_photo', 'delete_chat_photo', 'group_chat_created'
  ];
  
  /**
   * Both request method to obtain messages are implemented. To use standard polling, set `polling: true`
   * on `options`. Notice that [webHook](https://core.telegram.org/bots/api#setwebhook) will need a SSL certificate.
   * Emits `message` when a message arrives.
   *
   * @class TelegramBot
   * @constructor
   * @param {String} token Bot Token
   * @param {Object} [options]
   * @param {Boolean|Object} [options.polling=false] Set true to enable polling or set options
   * @param {String|Number} [options.polling.timeout=10] Polling time in seconds
   * @param {String|Number} [options.polling.interval=2000] Interval between requests in miliseconds
   * @param {Boolean|Object} [options.webHook=false] Set true to enable WebHook or set options
   * @param {String} [options.webHook.key] PEM private key to webHook server.
   * @param {String} [options.webHook.cert] PEM certificate (public) to webHook server.
   * @see https://core.telegram.org/bots/api
   */
  constructor(token, options = {}) {
    super();
    this.options = options;
    this.token = token;
    this.textRegexpCallbacks = [];
    this.onReplyToMessages = [];

    if (options.polling) {
      this.initPolling();
    }

    if (options.webHook) {
      this._WebHook = new TelegramBotWebHook(token, options.webHook, this.processUpdate);
    }
  }

  initPolling() {
    if (this._polling) {
      this._polling.abort = true;
      this._polling.lastRequest.cancel('Polling restart');
    }
    this._polling = new TelegramBotPolling(this.token, this.options.polling, this.processUpdate);
  }

  processUpdate = (update) => {
    debug('Process Update %j', update);
    const message = update.message;
    const inlineQuery = update.inline_query;
    const chosenInlineResult = update.chosen_inline_result;

    if (message) {
      debug('Process Update message %j', message);
      this.emit('message', message);
      const processMessageType = messageType => {
        if (message[messageType]) {
          debug('Emtting %s: %j', messageType, message);
          this.emit(messageType, message);
        }
      };
      TelegramBot.messageTypes.forEach(processMessageType);
      if (message.text) {
        debug('Text message');
        this.textRegexpCallbacks.forEach(reg => {
          debug('Matching %s whith', message.text, reg.regexp);
          const result = reg.regexp.exec(message.text);
          if (result) {
            debug('Matches', reg.regexp);
            reg.callback(message, result);
          }
        });
      }
      if (message.reply_to_message) {
        // Only callbacks waiting for this message
        this.onReplyToMessages.forEach(reply => {
          // Message from the same chat
          if (reply.chatId === message.chat.id) {
            // Responding to that message
            if (reply.messageId === message.reply_to_message.message_id) {
              // Resolve the promise
              reply.callback(message);
            }
          }
        });
      }
    } else if (inlineQuery) {
      debug('Process Update inline_query %j', inlineQuery);
      this.emit('inline_query', inlineQuery);
    } else if (chosenInlineResult) {
      debug('Process Update chosen_inline_result %j', chosenInlineResult);
      this.emit('chosen_inline_result', chosenInlineResult);
    }
  }

  // used so that other funcs are not non-optimizable
  _safeParse(json) {
    try {
      return JSON.parse(json);
    } catch (err) {
      throw new Error(`Error parsing Telegram response: ${String(json)}`);
    }
  }

  // request-promise
  _request(_path, options = {}) {
    if (!this.token) {
      throw new Error('Telegram Bot Token not provided!');
    }

    if (options.form) {
      const replyMarkup = options.form.reply_markup;
      if (replyMarkup && typeof replyMarkup !== 'string') {
        // reply_markup must be passed as JSON stringified to Telegram
        options.form.reply_markup = JSON.stringify(replyMarkup);
      }
    }
    options.url = this._buildURL(_path);
    options.simple = false;
    options.resolveWithFullResponse = true;
    debug('HTTP request: %j', options);
    return request(options)
      .then(resp => {
        if (resp.statusCode !== 200) {
          throw new Error(`${resp.statusCode} ${resp.body}`);
        }

        const data = this._safeParse(resp.body);
        if (data.ok) {
          return data.result;
        }

        throw new Error(`${data.error_code} ${data.description}`);
      });
  }
    /**
   * Generates url with bot token and provided path/method you want to be got/executed by bot
   * @return {String} url
   * @param {String} path
   * @private
   * @see https://core.telegram.org/bots/api#making-requests
   */
  _buildURL(_path) {
    return URL.format({
      protocol: 'https',
      host: 'api.telegram.org',
      pathname: `/bot${this.token}/${_path}`
    });
  }

  /**
   * Returns basic information about the bot in form of a `User` object.
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#getme
   */
  getMe() {
    const _path = 'getMe';
    return this._request(_path);
  }

  /**
   * Specify an url to receive incoming updates via an outgoing webHook.
   * @param {String} url URL where Telegram will make HTTP Post. Leave empty to
   * delete webHook.
   * @param {String|stream.Stream} [cert] PEM certificate key (public).
   * @see https://core.telegram.org/bots/api#setwebhook
   */
  setWebHook(url, cert) {
    const _path = 'setWebHook';
    const opts = { qs: { url } };

    if (cert) {
      const [formData, certificate] = this._formatSendData('certificate', cert);
      opts.formData = formData;
      opts.qs.certificate = certificate;
    }

    return this._request(_path, opts)
      .then(resp => {
        if (!resp) {
          throw new Error(resp);
        }

        return resp;
      });
  }

  /**
   * Use this method to receive incoming updates using long polling
   * @param  {Number|String} [timeout] Timeout in seconds for long polling.
   * @param  {Number|String} [limit] Limits the number of updates to be retrieved.
   * @param  {Number|String} [offset] Identifier of the first update to be returned.
   * @return {Promise} Updates
   * @see https://core.telegram.org/bots/api#getupdates
   */
  getUpdates(timeout, limit, offset) {
    const form = {
      offset,
      limit,
      timeout,
    };

    return this._request('getUpdates', { form });
  }

  /**
   * Send text message.
   * @param  {Number|String} chatId Unique identifier for the message recipient
   * @param  {String} text Text of the message to be sent
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  sendMessage(chatId, text, form = {}) {
    form.chat_id = chatId;
    form.text = text;
    return this._request('sendMessage', { form });
  }

  /**
   * Send answers to an inline query.
   * @param  {String} inlineQueryId Unique identifier of the query
   * @param  {InlineQueryResult[]} results An array of results for the inline query
   * @param  {Object} [options] Additional Telegram query options
   * @return {Promise}
   * @see https://core.telegram.org/bots/api#answerinlinequery
   */
  answerInlineQuery(inlineQueryId, results, form = {}) {
    form.inline_query_id = inlineQueryId;
    form.results = JSON.stringify(results);
    return this._request('answerInlineQuery', { form });
  }

  /**
   * Forward messages of any kind.
   * @param  {Number|String} chatId     Unique identifier for the message recipient
   * @param  {Number|String} fromChatId Unique identifier for the chat where the
   * original message was sent
   * @param  {Number|String} messageId  Unique message identifier
   * @return {Promise}
   */
  forwardMessage(chatId, fromChatId, messageId) {
    const form = {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    };

    return this._request('forwardMessage', { form });
  }

  _formatSendData(type, data) {
    let formData;
    let fileName;
    let fileId;
    if (data instanceof stream.Stream) {
      fileName = URL.parse(path.basename(data.path)).pathname;
      formData = {};
      formData[type] = {
        value: data,
        options: {
          filename: qs.unescape(fileName),
          contentType: mime.lookup(fileName)
        }
      };
    } else if (Buffer.isBuffer(data)) {
      const filetype = fileType(data);
      if (!filetype) {
        throw new Error('Unsupported Buffer file type');
      }
      formData = {};
      formData[type] = {
        value: data,
        options: {
          filename: `data.${filetype.ext}`,
          contentType: filetype.mime
        }
      };
    } else if (fs.existsSync(data)) {
      fileName = path.basename(data);
      formData = {};
      formData[type] = {
        value: fs.createReadStream(data),
        options: {
          filename: fileName,
          contentType: mime.lookup(fileName)
        }
      };
    } else {
      fileId = data;
    }
    return [formData, fileId];
  }
  