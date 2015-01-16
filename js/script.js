var process = require('child_process');
var media = null;
var video_format = null;
var audio_format = null;
var options = { 'audio': ["-x"], 'video': [], 'both': ["-k", "-x"] };
var process_queue = new Array();
var max_process = 4;
var current_process_count = 0;

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
  if (url == '') return;
  $('input#youtube-url').val("");
  var argus = options[media].slice();

  if (video_format !== null) {
    argus.push("-f", video_format);
  }
  if (audio_format !== null) {
    argus.push("--audio-format", audio_format);
  }

  argus.push("-o", $("#file-path").val() + "/%(title)s.%(ext)s", url);

  get_title(argus);
});

function get_title(argus) {
  var url = argus[argus.length - 1];
  var id = url.split("=")[1];

  var progressbar = "<p id='title-" + id + "' class='align-left'>標題擷取中...</p><div class='progress'><div id='" + id + "' class='progress-bar' role='progressbar' data-transitiongoal=''></div></div>";
  $(".container").append(progressbar);

  // Get video's title
  process.exec("youtube-dl -e " + url, { encoding: 'utf8' }, function(error, stdout, stderr) {
    if (error !== null) {
      $('p#title-' + id).text(url + " 這不是正確的網址");
    }
    else {
      $('p#title-' + id).text(stdout);

      if (current_process_count < max_process) {
        download(argus);
      }
      else {
        process_queue.push(argus);
      }
    }
  });
}

function download(argus) {
  var url = argus[argus.length - 1];
  var id = url.split("=")[1];

  var child = process.spawn("youtube-dl", argus);

  current_process_count += 1;
  console.log("a process run, total:" + current_process_count);

  child.stdout.on('data', function (data) {
    var value = parseInt($.trim(data).split(" ")[2].split("%")[0]);
    $("#" + id).attr('data-transitiongoal', value).progressbar({display_text: 'fill'});
  });

  child.stderr.on('data', function (data) {
  });

  child.on('exit', function (code) {
    $("#" + id).attr('data-transitiongoal', 100).progressbar({display_text: 'fill'});
    current_process_count -= 1;
    console.log("a process exit, total:" + current_process_count);
    if (current_process_count < max_process && process_queue.length != 0) {
      download(process_queue.shift())
    }
  });
}