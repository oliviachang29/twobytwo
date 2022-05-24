const { App } = require("@slack/bolt");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const CHANNEL_NAME = "hackathon-test";
const creds = require("./google_creds.json"); // the file saved above
const SHEET_ID = "1qEBIiUPjF6UWi08VDeumVYRmgbH3-xOmek8sncKt7g0";
const doc = new GoogleSpreadsheet(SHEET_ID);

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

async function loadGSheet() {}

async function createTwoByTwo() {
  // FIX THIS STUPID THING
  await doc.useServiceAccountAuth(creds);
  //   await doc.useServiceAccountAuth({
  //     client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  //     private_key: process.env.GOOGLE_PRIVATE_KEY,
  //   });

  await doc.loadInfo(); // loads document properties and worksheets
  const sheetCount = await doc.sheetCount;

  // get template sheet
  const templateSheet = await doc.sheetsByTitle["template"];

  // duplicate template sheet
  const newSheetId = sheetCount;
  const newSheetTitle = `${sheetCount} ${currentTwobytwo.top}-${currentTwobytwo.bottom}-${currentTwobytwo.left}-${currentTwobytwo.right}`;
  await templateSheet.duplicate({
    title: newSheetTitle,
    index: sheetCount,
    id: newSheetId,
  });

  // get template sheet
  const currentSheet = await doc.sheetsById[newSheetId];
  await currentSheet.loadCells("A1:M26");
  const top_label_cell = await currentSheet.getCellByA1("B2");
  const bottom_label_cell = await currentSheet.getCellByA1("B26");
  const right_label_cell = await currentSheet.getCellByA1("M3");
  const left_label_cell = await currentSheet.getCellByA1("A3");

  // update values
  top_label_cell.value = currentTwobytwo.top;
  bottom_label_cell.value = currentTwobytwo.bottom;
  right_label_cell.value = currentTwobytwo.right;
  left_label_cell.value = currentTwobytwo.left;
  await currentSheet.saveUpdatedCells();

  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?rm=demo&chrome=false&preview#gid=${newSheetId}`;
}

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

async function sayGSheetUrl(say, sheetUrl) {
  try {
    await say({
      text: "Twobytwo sheets link",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Plot yourself on a twobytwo!`,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Open",
              emoji: true,
            },
            url: sheetUrl,
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
}

app.event("app_mention", async ({ event, say }) => {
  currentTs = event.ts;
  console.log(event);
  saylabelInput(say, currentTs, "Left", "desert");
});

app.action("left_label_submitted", async ({ action, ack, say }) => {
  await ack();
  console.log(action);
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
  saylabelInput(say, currentTs, "Bottom", "cake");
});

app.action("bottom_label_submitted", async ({ action, ack, say }) => {
  await ack();
  currentTwobytwo.bottom = action.value;
  console.log(currentTwobytwo);
  say({ text: "Generating twobytwo...", thread_ts: currentTs });
  const sheetUrl = await createTwoByTwo();
  sayGSheetUrl(say, sheetUrl);
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
  await loadGSheet();
  // Find conversation with a specified channel `name`
  //   await findConversation(CHANNEL_NAME);
  //   console.log(channelId);
  //   await askForAxes();
})();
