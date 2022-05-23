const { App } = require("@slack/bolt");
const CHANNEL_NAME = "hackathon-test";

// set up environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  port: process.env.PORT || 3000,
});

let currentTs;
let currentTwobytwo = {
  left: "",
  right: "",
  top: "",
  bottom: "",
};

/** FOR DEBUGGING */
// app.use((args) => {
//   const copiedArgs = JSON.parse(JSON.stringify(args));
//   copiedArgs.context.botToken = "xoxb-***";
//   if (copiedArgs.context.userToken) {
//     copiedArgs.context.userToken = "xoxp-***";
//   }
//   copiedArgs.client = {};
//   copiedArgs.logger = {};
//   args.logger.info(
//     "Dumping request data for debugging...\n\n" +
//       JSON.stringify(copiedArgs, null, 2) +
//       "\n"
//   );
//   args.next();
// });

// app.event("app_mention", async ({ message, say }) => {
//   console.log("YOOO");
//   await say({ text: "Label 1: ", thread_ts: message.ts });
// });

async function saylabelInput(say, ts, location, example) {
  try {
    await say({
      text: `Choose a value for the label`,
      blocks: [
        {
          type: "input",
          dispatch_action: true,
          label: {
            type: "plain_text",
            text: `${location} Label`,
          },
          element: {
            type: "plain_text_input",
            action_id: `${location.toLowerCase()}_label_submitted`,
            dispatch_action_config: {
              trigger_actions_on: ["on_enter_pressed"],
            },
            placeholder: {
              type: "plain_text",
              text: `Example: "${example}"`,
            },
          },
        },
      ],
      thread_ts: ts,
    });
  } catch (error) {
    console.error(error);
  }
}

app.event("app_mention", async ({ event, say }) => {
  currentTs = event.ts;
  saylabelInput(say, currentTs, "Left", "desert");
});

// Find conversation ID using the conversations.list method
async function findConversation(channel_name) {
  try {
    const result = await app.client.conversations.list({
      token: process.env.SLACK_BOT_TOKEN,
    });

    for (const channel of result.channels) {
      if (channel.name === channel_name) {
        channelId = channel.id;
        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

app.action("left_label_submitted", async ({ action, ack, say }) => {
  await ack();
  currentTwobytwo.left = action.value;
  saylabelInput(say, currentTs, "Right", "mountain");
});

app.action("right_label_submitted", async ({ action, ack, say }) => {
  await ack();
  currentTwobytwo.right = action.value;
  saylabelInput(say, currentTs, "Top", "ice cream");
});

app.action("top_label_submitted", async ({ action, ack, say }) => {
  await ack();
  currentTwobytwo.top = action.value;
  saylabelInput(say, currentTs, "Bottom", "mountain");
});

app.action("bottom_label_submitted", async ({ action, ack, say }) => {
  await ack();
  currentTwobytwo.bottom = action.value;
  console.log(currentTwobytwo);
  say({ text: "Generating google sheet...", thread_ts: currentTs });
});

async function askForAxes() {
  try {
    // Call the chat.postMessage method using the WebClient
    const result = await app.client.chat.postMessage({
      channel: channelId,
      text: "Hello world",
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
  // Find conversation with a specified channel `name`
  //   await findConversation(CHANNEL_NAME);
  //   console.log(channelId);
  //   await askForAxes();
})();
