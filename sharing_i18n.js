var lang = 'pl';

var dictionaries = {
  pl: {
    "WebSocket is not supported by your browser.":
      "Protokół WebSocket nie jest wspierany przez twoją przeglądarkę.",
    "Connection to server closed.":
      "Połączenie z serwerem zostało zamknięte.",
    "Timeout: Server has not sent valid message.":
      "Przekroczenie czasu oczekiwania: Serwer nie wysłał poprawnej wiadomości."
  }
};

function I18N(dictionary) {
  var dictionary = dictionary;
  var translate = function(str) {
    if (typeof dictionary[str] != "undefined") {
      return dictionary[str];
    } else {
      return str;
    }
  };
  return translate;
}

var tr = I18N(dictionaries[lang]);

