# Instagram Slackbot

[Instagram API](https://www.instagram.com/developer/endpoints/) and [Slack app](https://efishery.slack.com/apps) with [Botkit](https://github.com/howdyai/botkit). Built for quick marketing queries and announcing media posts with [NodeJS](http://nodejs.org/) and [MongoDB](https://www.mongodb.com/).

## Bot commands

There are two bot command types, media query and administration. Both of them use the database to do their job correctly. Media query commands are related to Instagram media posts, while administration commands are related to user privileges.

### Query Commands

#### List of Query Commands

Command     | Description                       | Status    |
----------- | --------------------------------- | --------- |
!review     | Review all media posts            | Available |
!countlikes | Count number of posts likes       | Available |
!mostlikes  | Show posts with most likes        | Available |
!followers  | Show number of followers          | N/A       |

#### Query Commands Arguments

Argument     | Shorthand     | Default          | Description                           | Related commands    | Required |
------------ | ------------- | ---------------- | ------------------------------------- | ------------------- | -------- |
--from       | -f            | Last Monday      | Start date in *DD-MM-YYYY* format     | *all commands*      | No       |
--to         | -t            | Next Sunday      | End date in *DD-MM-YYYY* format       | *all commands*      | No       |
--sort       | -s            | `likes:desc`     | Sorting order in *field:order* format | *review*            | No       |

Available sorting parameters for sort argument:

1. **field**: *time*, *likes*, *comments*, *tags*,
2. **order**: *asc* (ascending), *desc* (descending).

#### Queries Example

1. Review media posts on this week: `!review`
2. Get medias with most likes on certain period, sorted ascending on likes field: `!mostlikes -f 15-06-2017 -t 22-06-2017 -s likes:asc`

### Administration Commands

#### List of Administration Commands

Command       | Description                             | Status    |
------------- | --------------------------------------- | --------- |
!help         | Show list of commands                   | Available |
!admins       | Show list of admins                     | Available |
!promote      | Grant given user admin privilege        | Available |
!demote       | Remove privilege from given user        | Available |
!channels     | Show list of broadcast channels         | Available |
!setbroadcast | Set channel to broadcast posted medias  | Available |

#### Administration Commands Arguments

Argument     | Shorthand     | Default          | Description             | Related commands    | Required |
------------ | ------------- | ---------------- | ----------------------- | ------------------- | -------- |
--user       | -u            | -                | Slack username          | *promote*, *demote* | Yes      |
--channel    | -c            | -                | Channel name or `~here` | *setbroadcast*      | Yes      |
--broadcast  | -b            | `on`             | `on` or `off`           | *setbroadcast*      | No       |
