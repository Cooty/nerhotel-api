/**
 * Main function that will be triggered, has to be set for installable scripts.
 * **Important** If you choose to rename this function you should also change the settings for the Trigger
 * since `function to run` dropdown should have this function in it.
 *
 * @param e [Edit event](https://developers.google.com/apps-script/guides/triggers/events#edit)
 * @returns
 */
function handleSheetEdit(e) {
  if (!e || !e.source) {
    Logger.log(
      "This function must be triggered by editing a cell in the spreadsheet.",
    );
    return;
  }

  setLastUpdatedAtColumn(e);
  triggerCacheBuster();
}

/**
 * Set's the value of the cell of the AQ column in the current row to the date current data in `yyyy-mm-dd` format
 *
 * @param e [Edit event](https://developers.google.com/apps-script/guides/triggers/events#edit)
 */
function setLastUpdatedAtColumn(e) {
  const sheet = e.source.getActiveSheet();
  const row = e.range.getRow();
  const col = e.range.getColumn();
  const dateColumn = 43; // AQ column

  // Update the timestamp in column AQ (if the edit was not in AQ and not on header)
  if (col !== dateColumn && row > 1) {
    const cell = sheet.getRange(row, dateColumn);
    cell.setValue(new Date());
    cell.setNumberFormat("yyyy-mm-dd");
  }
}

/**
 * Sends a network call to clear the cache of the API layer that connects the sheet with our client application
 *
 * @returns
 */
function triggerCacheBuster() {
  // WEBHOOK_URL and WEBHOOK_SECRET are expected to be set in Script Properties
  const WEBHOOK_URL =
    PropertiesService.getScriptProperties().getProperty("WEBHOOK_URL");

  if (!WEBHOOK_URL) {
    Logger.log("Error: WEBHOOK_URL is not defined in Script Properties.");
    return;
  }

  const WEBHOOK_SECRET =
    PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");

  if (!WEBHOOK_SECRET) {
    Logger.log("Error: WEBHOOK_SECRET is not defined in Script Properties.");
    return;
  }

  const options = {
    method: "post",
    headers: {
      "X-Webhook-Secret": WEBHOOK_SECRET,
    },
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Status Code: " + response.getResponseCode());
    Logger.log("Cache Buster Response: " + response.getContentText());
  } catch (error) {
    Logger.log("Failed to call Cache Buster: " + error.toString());
  }
}
