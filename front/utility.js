function parseTGvalues(tgWebAppData) {
    // The data string provided
//var tgWebAppData = "#tgWebAppData=query_id=AAGW9kBKAgAAAJb2QErvmfk6&user={\"id\":5540738710,\"first_name\":\"Mohsen\",\"last_name\":\"\",\"username\":\"MohsenEMX\",\"language_code\":\"en\",\"allows_write_to_pm\":true}&auth_date=1714326902&hash=6584d5007f7f1b632dd8cf7e864484f8666b982442e555d109eac287bec371b1&tgWebAppVersion=7.2&tgWebAppPlatform=tdesktop&tgWebAppThemeParams={\"accent_text_color\":\"#6ab3f2\",\"bg_color\":\"#17212b\",\"button_color\":\"#5289c1\",\"button_text_color\":\"#ffffff\",\"destructive_text_color\":\"#ec3942\",\"header_bg_color\":\"#17212b\",\"hint_color\":\"#708599\",\"link_color\":\"#6ab3f3\",\"secondary_bg_color\":\"#232e3c\",\"section_bg_color\":\"#17212b\",\"section_header_text_color\":\"#6ab3f3\",\"subtitle_text_color\":\"#708599\",\"text_color\":\"#f5f5f5\"}";

// Splitting the string by '&' to get individual key-value pairs
var dataPairs = tgWebAppData.split('&');

// Creating an empty object to store parsed data
var parsedData = {};

// Looping through each key-value pair
dataPairs.forEach(function(pair) {
  // Splitting each pair by '=' to separate key and value
  var keyValue = pair.split('=');
  
  // Decoding URI component to handle special characters
  var key = decodeURIComponent(keyValue[0]);
  var value = decodeURIComponent(keyValue[1]);

  // Handling nested JSON strings
  if (value.startsWith('{') && value.endsWith('}')) {
    // If the value is a JSON string, parse it
    parsedData[key] = JSON.parse(value);
  } else {
    // Otherwise, store the value as is
    parsedData[key] = value;
  }
});

return parsedData;
}