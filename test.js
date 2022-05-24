require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");

const creds = require("./google_creds.json"); // the file saved above
var moment = require("moment"); // require
const SHEET_ID = "1qEBIiUPjF6UWi08VDeumVYRmgbH3-xOmek8sncKt7g0";

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
    title: `${sheetCount} helelo - fjdskf`,
    index: sheetCount,
    id: newSheetId,
  });

  const currentSheet = await doc.sheetsById[newSheetId];
  await currentSheet.loadCells("A1:M26");
  const top_label_cell = await currentSheet.getCellByA1("B2");
  const bottom_label_cell = await currentSheet.getCellByA1("B26");
  const right_label_cell = await currentSheet.getCellByA1("M3");
  const left_label_cell = await currentSheet.getCellByA1("A3");
  top_label_cell.value = "ice cream";
  bottom_label_cell.value = "soda";
  right_label_cell.value = "desert";
  left_label_cell.value = "mountain";
  await currentSheet.saveUpdatedCells();

  console.log(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?rm=demo&chrome=false&preview#gid=${newSheetId}`
  );
})();
