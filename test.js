require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");
var moment = require("moment");
const currentTwobytwo = { left: "a", right: "b", top: "c", bottom: "d" };

(async () => {
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
  await doc.useServiceAccountAuth({
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  });

  await doc.loadInfo(); // loads document properties and worksheets
  sheetCount = await doc.sheetCount;

  // get template sheet
  const templateSheet = await doc.sheetsByTitle["template"];

  // duplicate template sheet
  const newSheetId = sheetCount;
  const newSheetTitle = `${moment().format("M-D")} ${currentTwobytwo.top}-${
    currentTwobytwo.bottom
  }-${currentTwobytwo.left}-${currentTwobytwo.right}`;
  await templateSheet.duplicate({
    title: `${newSheetTitle}`,
    index: sheetCount,
    id: newSheetId,
  });

  const currentSheet = await doc.sheetsById[newSheetId];
  await currentSheet.loadCells("A1:M26");
  const top_label_cell = await currentSheet.getCellByA1("B2");
  const bottom_label_cell = await currentSheet.getCellByA1("B26");
  const right_label_cell = await currentSheet.getCellByA1("M3");
  const left_label_cell = await currentSheet.getCellByA1("A3");
  top_label_cell.value = currentTwobytwo.top;
  bottom_label_cell.value = currentTwobytwo.bottom;
  right_label_cell.value = currentTwobytwo.right;
  left_label_cell.value = currentTwobytwo.left;
  await currentSheet.saveUpdatedCells();

  console.log(
    `https://docs.google.com/spreadsheets/d/${process.env.SHEET_ID}/edit?rm=demo&chrome=false&preview#gid=${newSheetId}`
  );
})();
