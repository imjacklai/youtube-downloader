var media = null;
var video_format = null;
var audio_format = null;

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