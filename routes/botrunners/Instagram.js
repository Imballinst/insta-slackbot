const moment = require('moment');

const { events, commandRegexes } = require('../../libs/constants/Commands');
const { broadcastMessages } = require('../../libs/constants/CommonVariables');

const { winstonInfo, winstonError } = require('../../libs/LogUtil');
const { getMediaById } = require('../../libs/InstagramQueries');
const { getChannels } = require('../../libs/MongoQueries');
const { processMessage, batchReply } = require('../../libs/MessageUtil');

function initInstagramFeatures(app, botInstance, botController) {
  // On route hit
  app.post('/callback-sub', (req, res) => {
    winstonInfo('Got POST request from Instagram Subscriptions: ', req.body);

    // JSON Object of POST data
    const mediaID = req.body['0'].data.media_id;
    const messageIndex = Math.floor(Math.random() * 6);

    getMediaById(mediaID).then((response) => {
      const jsonObject = JSON.parse(response);
      const { data, meta } = jsonObject;

      if (meta.code === 200) {
        // If media exists
        const { id, created_time: createdTime, link, caption } = data;
        const text = caption ? `\n\n"${caption.text}"` : '';
        const currentTZ = moment.unix(parseInt(createdTime, 10)).toISOString();

        app.locals.mongoDriver.db.collection('postedmedias').insertOne({
          id,
          created_time: new Date(currentTZ),
        });

        res.send();

        return getChannels(app.locals.mongoDriver.db)
          .then((dbResponse) => {
            dbResponse.data.forEach((channel) => {
              botInstance.say({
                text: `${broadcastMessages[messageIndex]} ${link} ${text}`,
                channel: channel.channel_id,
              });
            });
          }).catch(err => winstonError(err));
      }
        // If media doesn't exist
      throw new Error('Media not found!');
    });
  });

  // List command regexes
  const {
    review: reviewRegex,
    mostlikes: mostlikesRegex,
    countlikes: countlikesRegex,
  } = commandRegexes;

  /**
   * Media Commands
   */
  botController.hears([reviewRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ posts, params, helpText }) => {
      if (!helpText) {
        const { startDate, endDate, sort } = params;

        // let botMsg = '';
        let sortedPosts = posts;

        if (sort) {
          const [sortFieldInput, sortOrder] = sort.split(':');
          const orderArray = sortOrder === 'asc' ? [1, -1] : [-1, 1];

          const sortField = sortFieldInput === 'time' ? 'created_time' : sortFieldInput;

          sortedPosts = posts.sort((a, b) => {
            if (a[sortField] > b[sortField]) {
              return orderArray[0];
            }

            return orderArray[1];
          });
        } else {
          // Sort by date if not defined
          sortedPosts = posts.sort((a, b) => {
            if (a.created_time > b.created_time) {
              return 1;
            }

            return -1;
          });
        }

        bot.reply(message, `Review dari ${startDate} hingga ${endDate}:\n`, (err) => {
          if (!err) {
            batchReply(bot, message, sortedPosts, 0);
          } else {
            bot.reply(message, err);
          }
        });
      } else {
        bot.reply(message, helpText);
      }
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err.message);
    });
  });

  botController.hears([countlikesRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ posts, params, helpText }) => {
      let botMsg;

      if (!helpText) {
        const { startDate, endDate } = params;
        const totalLikes = `*${posts.reduce((sum, val) => sum + val.likes.count, 0)}*`;

        botMsg = `Total post likes count dari ${startDate} hingga ${endDate} ada ${totalLikes}.`;
      } else {
        botMsg = helpText;
      }

      bot.reply(message, botMsg);
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err.message);
    });
  });

  botController.hears([mostlikesRegex], events, (bot, message) => {
    winstonInfo(`Message: ${JSON.stringify(message)}`);

    processMessage(app.locals.mongoDriver.db, message).then(({ posts, params, helpText }) => {
      // If help text is not defined
      if (!helpText) {
        const { startDate, endDate } = params;
        let mostLikedPosts = [];

        posts.reduce((maxLikes, curDoc) => {
          const {
            link,
            created_time: createdAt,
            likes,
            caption,
            tags,
            comments,
          } = curDoc;

          if (likes.count >= maxLikes) {
            if (likes.count > maxLikes) { mostLikedPosts = []; }

            // For immutability
            mostLikedPosts = mostLikedPosts.concat({
              link,
              created_time: createdAt,
              likes,
              caption,
              tags,
              comments,
            });
          }

          // Return the maximum number of likes
          return Math.max(maxLikes, likes.count);
        }, -Infinity);

        bot.reply(
          message,
          `Post dengan likes terbanyak dari ${startDate} hingga ${endDate}:\n`,
          (err) => {
            if (!err) {
              batchReply(bot, message, mostLikedPosts, 0);
            }
          }
        );
      } else {
        bot.reply(message, helpText);
      }
    }).catch((err) => {
      winstonError(err);

      bot.reply(message, err.message);
    });
  });
}

module.exports = initInstagramFeatures;
