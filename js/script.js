var spawn = require('child_process').spawn;
var media = null;
var video_format = null;
var audio_format = null;
var options = { 'audio': ["-x"], 'video': [], 'both': ["-k", "-x"] };

$('input:radio').change(function() {
  media = $('input[type="radio"][name="media"]:checked').val()
  if (media === 'audio') {
    $('select#audio-format').prop({'disabled': false});
    $('select#video-format').prop({'disabled': 'disabled', 'value': 'null'});
    video_format = null;
  }
  else if (media === "video") {
    $('select#audio-format').prop({'disabled': 'disabled', 'value': 'null'});
    $('select#video-format').prop({'disabled': false});
    audio_format = null;
  }
  else {
    $('select#audio-format').prop({'disabled': false});
    $('select#video-format').prop({'disabled': false});
  }
});

$('select#video-format').change(function() {
  video_format = $('select#video-format option:selected').val();
  $('#download-btn').prop({'disabled': false});
});

$('select#audio-format').change(function() {
  audio_format = $('select#audio-format option:selected').val();
  $('#download-btn').prop({'disabled': false});
});

$('#path-chooser').click(function() {
  var chooser = $('#path-dialog');
  chooser.change(function(event) {
    $("#file-path").val($(this).val());
  });
  chooser.trigger('click');
});

$('#download-btn').click(function() {
  var url = $('input#youtube-url').val();
  $('input#youtube-url').val("");
  var argus = options[media];

  if (video_format !== null) {
    argus.push("-f", video_format);
  }
  if (audio_format !== null) {
    argus.push("--audio-format", audio_format);
  }

  argus.push("-o", $("#file-path").val() + "/%(title)s.%(ext)s", url);

  download(argus);
});

function download(argus) {
  var child = spawn("youtube-dl", argus);

  child.stdout.on('data', function (data) {
    console.log(data);
  });

  child.stderr.on('data', function (data) {
    
  });

  child.on('exit', function (code) {
    
  });
}