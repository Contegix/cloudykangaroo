var renderButton = function(client, check) {
 return "<button onclick=\"silenceCheck('"+client+"', '"+check+"');\" class=\"btn btn-default btn-xs btn-event\"><span class=\"glyphicon glyphicon-volume-off span-event active\"></span></button>"
}

var silenceCheck = function(client, check) {
  bootbox.prompt({ title: "Length of time to silence in hours (<= 72)", message: "Please enter a length of time to silence: in hours, less than 72 hours.", value: 8, callback: function(result) {
    if (result != null && parseInt(result) <= 72) {
      var api_uri = '/api/v1/sensu/silence/';
      var call_uri;
      if (check != 'false') {
       call_uri = api_uri + 'client/' + encodeURI(client) + '/check/' + encodeURI(check);
      } else {
        call_uri = api_uri + 'client/' +  encodeURI(client);
      }
      var params = "expires="+result*3600;
      var req = new XMLHttpRequest();
      req.open('post', call_uri, false);
      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      req.setRequestHeader("Content-length", params.length);
      req.setRequestHeader("Connection", "close");
      req.send(params);
      location.reload();
    } else {
      bootbox.confirm("Length of time to silence in hours must be an integer <= 72", function(result) {})
    }
  }})
}

var displayTextAlert = function(text)
{
  bootbox.alert('<pre>' + syntaxHighlight(decodeURI(text)) + '</pre>');
}

function syntaxHighlight(json) {
  if (typeof json != 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}
