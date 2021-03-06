const IncomingWebhook = require('@slack/client').IncomingWebhook;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);


// subscribe is the main function called by Cloud Functions.
module.exports.subscribe = (event, callback) => {

 const build = eventToBuild(event.data.data || event.data);

  // Skip if the current status is not in the status list.
  // Add additional statues to list if you'd like:
  // QUEUED, WORKING, SUCCESS, FAILURE,
  // INTERNAL_ERROR, TIMEOUT, CANCELLED
  const status = ['WORKING', 'SUCCESS', 'FAILURE', 'INTERNAL_ERROR', 'TIMEOUT', 'CANCELLED'];
  if (status.indexOf(build.status) === -1) {
    return callback();
  }


// Send message to Slack.
  const message = createSlackMessage(build);
  webhook.send(message, (err, res) => {
    if (err) console.log('Error:', err);
    callback(err);
  });
};


// eventToBuild transforms pubsub event message to a build object.
const eventToBuild = (data) => {
  return JSON.parse(new Buffer(data, 'base64').toString());
}

function statusToColor(status) {
  switch (status) {
    case 'SUCCESS':
      return 'good'
    case 'FAILURE':
    case 'INTERNAL_ERROR':
    case 'TIMEOUT':
    case 'CANCELLED':
      return 'danger'
    case 'WORKING':
      return '#2956B2'
    default:
      return 'danger'
  }
}

// createSlackMessage create a message from a build object.
const createSlackMessage = (build) => {
  let attachment = {
    color: statusToColor(build.status),
    title: `${build.status} on ${build.source.repoSource.repoName}`,
    title_link: build.logUrl,
    fields: [
        {
            "title": "Branch: ",
            "value": build.source.repoSource.branchName + ' :pick: :unicorn-run:',
            "short": false
        },
        {
          "title": "Commit: ",
          "value": getRepo(build),
          "short": false
        }
    ]
  };

  if(build.status ==='FAILURE'){
    attachment.fields[0] ={
      "title": "Branch: ",
      "value": build.source.repoSource.branchName +
       ' :sad-panda: :saddog: :faceangry: :hankey: :skull_and_crossbones:',
      "short": false
      };
  }

  if (build.status ==='SUCCESS' && build.source.repoSource.branchName === 'develop') {
    attachment.fields = [
        {
            "title": "Branch: ",
            "value": build.source.repoSource.branchName + ' :thumbsup: :duck: :rocket:',
            "short": false
        },
        {
          "title": "Commit: ",
          "value": getRepo(build),
          "short": false
        }
    ]
    if (build.substitutions && build.substitutions['_FE_STAGING_BUCKET_NAME']) {
      attachment.fields.push({
        "title": "App Url: ",
        "value": 'http://' + build.substitutions['_FE_STAGING_BUCKET_NAME'],
        "short": false
      })
    }
  }

  attachment.fields.push({
    "title": "Cloud Build Url: ",
    "value": build.logUrl,
    "short": false
  })

  let message = {
    attachments: [
      attachment
    ],
  };
  return message
}


function getRepo(build){
  let reposName = build.sourceProvenance.resolvedRepoSource.repoName;
  reposName = reposName.replace('github_','https://github.com/').replace('_','/')
  reposName +='/commit/'+build.sourceProvenance.resolvedRepoSource.commitSha;
  return reposName;
}
