require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");

const creds = require("./google_creds.json"); // the file saved above
var moment = require("moment"); // require
SHEET_ID = "1qEBIiUPjF6UWi08VDeumVYRmgbH3-xOmek8sncKt7g0";

(async () => {
  const doc = new GoogleSpreadsheet(SHEET_ID);
  // FIX THIS STUPID THING
  await doc.useServiceAccountAuth(creds);
  //   await doc.useServiceAccountAuth({
  //     client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  //     private_key: process.env.GOOGLE_PRIVATE_KEY,
  //   });

  await doc.loadInfo(); // loads document properties and worksheets
  sheetCount = await doc.sheetCount;

  // get template sheet
  const templateSheet = await doc.sheetsByTitle["template"];

  // duplicate template sheet
  const newSheetId = sheetCount;
  await templateSheet.duplicate({
    title: moment().format("MMMM Do YYYY, h:mm:ss a"),
    index: sheetCount,
    id: newSheetId,
  });

  const currentSheet = await doc.sheetsById[newSheetId];
  // await sheet.loadCells("A1:M26");
  // const top_label_cell = await sheet.getCellByA1("F1");
  // console.log(doc.title);
  // console.log(sheet.title);
  // console.log(top_label_cell.value);
})();
