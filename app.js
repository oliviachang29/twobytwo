const { App } = require("@slack/bolt");
const { GoogleSpreadsheet } = require("google-spreadsheet");
var moment = require("moment");
// set up environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const viewContent = require("./viewContent.json");

axes = [
  { name: "top", cell_location: "B2" },
  { name: "bottom", cell_location: "B26" },
  { name: "right", cell_location: "M3" },
  { name: "left", cell_location: "A3" },
];

const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
});

async function createTwoByTwo(currentTwobytwo) {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  await doc.loadInfo();
  const sheetCount = await doc.sheetCount;
  const templateSheet = await doc.sheetsByTitle["template"];

  // duplicate template sheet
  const newSheetId = sheetCount;
  const newSheetTitle = `${moment().format("M-D")} ${currentTwobytwo.top}-${
    currentTwobytwo.bottom
  }-${currentTwobytwo.left}-${currentTwobytwo.right}`;
  await templateSheet.duplicate({
    title: newSheetTitle,
    index: sheetCount,
  });

  // get created sheet
  const currentSheet = await doc.sheetsByTitle[newSheetTitle];
  await currentSheet.loadCells("A1:M26");

  axes.forEach(async (axis) => {
    let currentCell = await currentSheet.getCellByA1(axis.cell_location);
    currentCell.value = currentTwobytwo[axis.name];
    await currentSheet.saveUpdatedCells();
  });

  await currentSheet.saveUpdatedCells();

  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?rm=demo&chrome=false&preview#gid=${newSheetId}`;
}

async function sayGSheetUrl(user, sheetUrl) {
  try {
    await app.client.chat.postMessage({
      channel: user,
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

// Update the view on submission
app.view("modal-identifier", async ({ ack, body }) => {
  await ack();
  const values = body.view.state.values;

  const currentTwobytwo = {
    left: "",
    right: "",
    top: "",
    bottom: "",
  };

  axes.forEach((axis) => {
    currentTwobytwo[axis.name] = values[axis.name].text_input.value;
  });
  console.log(currentTwobytwo);

  const sheetUrl = await createTwoByTwo(currentTwobytwo);
  console.log(sheetUrl);

  const user = body["user"]["id"];
  await sayGSheetUrl(user, sheetUrl);
});

// The open_modal shortcut opens a plain old modal
// Shortcuts require the command scope
app.command("/twobytwo", async ({ ack, payload, client }) => {
  await ack();
  try {
    const result = await client.views.open({
      trigger_id: payload.trigger_id,
      view: viewContent,
    });

    console.log("Modal opened");
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);
  console.log("twobytwo app is running!");
})();
